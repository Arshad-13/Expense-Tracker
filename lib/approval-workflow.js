// Approval Workflow Service
// Handles complex approval workflows as per requirements
import prisma from './prisma';

export class ApprovalWorkflowService {
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Submit expense and initialize approval workflow
   */
  async submitExpense(expenseData, submitterId) {
    const submitter = await this.prisma.user.findUnique({
      where: { id: submitterId },
      include: {
        company: { include: { settings: true } },
        reportsTo: { include: { manager: true } }
      }
    });

    // Find applicable workflow
    const workflow = await this.findApplicableWorkflow(expenseData, submitter.companyId);
    
    // Create expense
    const expense = await this.prisma.expense.create({
      data: {
        ...expenseData,
        submittedById: submitterId,
        companyId: submitter.companyId,
        workflowId: workflow?.id,
        status: 'PENDING',
        currentStep: 1
      }
    });

    // Initialize approval workflow
    await this.initializeApprovalWorkflow(expense, workflow, submitter);
    
    // Log to history
    await this.logApprovalHistory(expense.id, 'SUBMITTED', submitterId, null, 'PENDING');

    return expense;
  }

  /**
   * Initialize approval workflow for an expense
   */
  async initializeApprovalWorkflow(expense, workflow, submitter) {
    const approvers = [];
    let sequenceOrder = 1;

    // Step 1: Add manager if required and submitter is not a manager
    // If isManager is false, skip manager approval and go directly to other approvers
    // If isManager is true, include manager in the approval chain
    if ((workflow?.requireManager || !workflow) && expense.isManager) {
      const manager = submitter.reportsTo[0]?.manager;
      if (manager) {
        const currentOrder = sequenceOrder++;
        approvers.push({
          expenseId: expense.id,
          approverId: manager.id,
          sequenceOrder: currentOrder,
          isManager: true,
          isRequired: true,
          status: 'PENDING',
          isActive: currentOrder === 1 // First approver is active
        });
      }
    }

    // Step 2: Add workflow steps
    if (workflow?.steps) {
      const sortedSteps = workflow.steps.sort((a, b) => a.stepNumber - b.stepNumber);
      
      for (const step of sortedSteps) {
        let approverId;
        
        if (step.approverId) {
          approverId = step.approverId;
        } else if (step.approverRole) {
          // Find user by role in company
          const roleUser = await this.findUserByRole(submitter.companyId, step.approverRole);
          approverId = roleUser?.id;
        }

        if (approverId && !approvers.some(a => a.approverId === approverId)) {
          approvers.push({
            expenseId: expense.id,
            approverId,
            sequenceOrder: sequenceOrder++,
            isManager: step.isManagerStep,
            isRequired: step.isRequired,
            canBypass: step.canBypass,
            status: 'PENDING',
            isActive: false // Will be activated in sequence
          });
        }
      }
    }

    // Create all approvers
    if (approvers.length > 0) {
      await this.prisma.expenseApprover.createMany({
        data: approvers
      });

      // Activate first approver
      await this.activateNextApprover(expense.id);
    }
  }

  /**
   * Process approval decision
   */
  async processApproval(expenseId, approverId, decision, comment) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        approvers: { orderBy: { sequenceOrder: 'asc' } },
        workflow: { include: { steps: true } },
        company: { include: { approvalRules: true } }
      }
    });

    if (!expense) {
      throw new Error('Expense not found.');
    }

    const approverRecord = expense.approvers.find(a => a.approverId === approverId);
    if (!approverRecord) {
      throw new Error('You are not an authorized approver for this expense.');
    }

    if (approverRecord.status !== 'PENDING') {
      throw new Error('You have already processed or been skipped for this expense approval.');
    }

    if (!expense.workflow || expense.workflow.enforceSequence) {
      const currentApprover = expense.approvers.find(a => a.sequenceOrder === expense.currentStep);
      if (!currentApprover || currentApprover.approverId !== approverId || !currentApprover.isActive) {
        throw new Error('You are not the currently active approver for this step.');
      }
    }

    // Record the decision
    const approvalDecision = await this.prisma.approvalDecision.create({
      data: {
        expenseId,
        approverId,
        decision,
        comment,
        stepNumber: expense.currentStep,
        decisionAt: new Date()
      }
    });

    // Update approver status
    await this.prisma.expenseApprover.updateMany({
      where: {
        expenseId,
        approverId,
        sequenceOrder: expense.currentStep
      },
      data: {
        status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
      }
    });

    // Log to history
    await this.logApprovalHistory(
      expenseId,
      decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      approverId,
      expense.status,
      null,
      comment
    );

    // Check if expense should be auto-approved based on rules
    const autoApproval = await this.checkAutoApprovalRules(expense, approverId);
    if (autoApproval.shouldAutoApprove) {
      return await this.finalizeApproval(expense, 'AUTO_APPROVED', autoApproval.reason);
    }

    // If rejected, finalize rejection
    if (decision === 'REJECT') {
      return await this.finalizeApproval(expense, 'REJECTED', 'Rejected by approver');
    }

    // Check if all required approvals are met
    const approvalStatus = await this.checkApprovalStatus(expense);
    
    if (approvalStatus.isComplete) {
      return await this.finalizeApproval(expense, 'APPROVED', 'All approvals completed');
    }

    // Move to next step in sequential workflow
    if (expense.workflow?.enforceSequence) {
      const nextStep = expense.currentStep + 1;
      const hasNextApprover = expense.approvers.some(a => a.sequenceOrder === nextStep);
      
      if (hasNextApprover) {
        await this.prisma.expense.update({
          where: { id: expenseId },
          data: { 
            currentStep: nextStep,
            status: 'IN_PROGRESS'
          }
        });
        
        await this.activateNextApprover(expenseId);
      } else {
        // No more approvers, check if we can approve
        return await this.finalizeApproval(expense, 'APPROVED', 'Sequential approval complete');
      }
    }

    return expense;
  }

  /**
   * Check auto-approval rules
   */
  async checkAutoApprovalRules(expense, approverId) {
    const rules = expense.company.approvalRules.filter(r => r.isActive);
    
    for (const rule of rules) {
      // Check specific user rule
      if (rule.ruleType === 'SPECIFIC_USER' && rule.specificUserId === approverId) {
        return {
          shouldAutoApprove: true,
          reason: `Auto-approved by ${rule.name}`,
          ruleId: rule.id
        };
      }

      // Check hybrid rule (percentage OR specific user)
      if (rule.ruleType === 'HYBRID') {
        if (rule.specificUserId === approverId) {
          return {
            shouldAutoApprove: true,
            reason: `Auto-approved by specific approver in ${rule.name}`,
            ruleId: rule.id
          };
        }
      }

      // Check amount-based conditions
      if (rule.minAmount && expense.amountInCompany < rule.minAmount) continue;
      if (rule.maxAmount && expense.amountInCompany > rule.maxAmount) continue;

      // Check category conditions
      if (rule.categories) {
        const allowedCategories = JSON.parse(rule.categories);
        if (!allowedCategories.includes(expense.category)) continue;
      }

      // Check percentage rule
      if (rule.ruleType === 'PERCENTAGE' || rule.ruleType === 'HYBRID') {
        const approvalStats = await this.calculateApprovalPercentage(expense.id);
        if (approvalStats.approvalPercentage >= rule.thresholdPct) {
          return {
            shouldAutoApprove: true,
            reason: `${rule.thresholdPct}% approval threshold met (${rule.name})`,
            ruleId: rule.id
          };
        }
      }
    }

    return { shouldAutoApprove: false };
  }

  /**
   * Calculate approval percentage
   */
  async calculateApprovalPercentage(expenseId) {
    const approvers = await this.prisma.expenseApprover.findMany({
      where: { expenseId },
      include: { approver: true }
    });

    const totalApprovers = approvers.filter(a => a.isRequired).length;
    const approvedCount = approvers.filter(a => a.status === 'APPROVED' && a.isRequired).length;
    const rejectedCount = approvers.filter(a => a.status === 'REJECTED').length;
    const pendingCount = approvers.filter(a => a.status === 'PENDING').length;

    return {
      totalApprovers,
      approvedCount,
      rejectedCount,
      pendingCount,
      approvalPercentage: totalApprovers > 0 ? (approvedCount / totalApprovers) * 100 : 0
    };
  }

  /**
   * Check overall approval status
   */
  async checkApprovalStatus(expense) {
    const stats = await this.calculateApprovalPercentage(expense.id);
    
    // If any required approver rejected, expense is rejected
    if (stats.rejectedCount > 0) {
      return { isComplete: true, finalStatus: 'REJECTED' };
    }

    // Check if we have minimum required approvals
    const hasMinimumApprovals = stats.approvedCount >= (expense.workflow?.minimumApprovers || 1);
    
    // For sequential workflows, check if all steps are complete
    if (expense.workflow?.enforceSequence) {
      const allRequiredApproved = stats.pendingCount === 0;
      return { 
        isComplete: allRequiredApproved && hasMinimumApprovals, 
        finalStatus: 'APPROVED' 
      };
    }

    // For parallel workflows, check percentage or minimum count
    return { 
      isComplete: hasMinimumApprovals, 
      finalStatus: 'APPROVED' 
    };
  }

  /**
   * Finalize expense approval/rejection
   */
  async finalizeApproval(expense, finalStatus, reason) {
    const updatedExpense = await this.prisma.expense.update({
      where: { id: expense.id },
      data: { 
        status: finalStatus,
        currentStep: null // Workflow complete
      }
    });

    // Deactivate remaining approvers
    await this.prisma.expenseApprover.updateMany({
      where: {
        expenseId: expense.id,
        status: 'PENDING'
      },
      data: { status: 'BYPASSED' }
    });

    // Log final decision
    await this.logApprovalHistory(
      expense.id,
      finalStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      'SYSTEM',
      expense.status,
      finalStatus,
      reason
    );

    return updatedExpense;
  }

  /**
   * Activate next approver in sequence
   */
  async activateNextApprover(expenseId) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: { approvers: { orderBy: { sequenceOrder: 'asc' } } }
    });

    const currentApprover = expense.approvers.find(a => a.sequenceOrder === expense.currentStep);
    if (currentApprover) {
      await this.prisma.expenseApprover.update({
        where: { id: currentApprover.id },
        data: { 
          isActive: true,
          notifiedAt: new Date()
        }
      });
    }
  }

  /**
   * Find applicable workflow for expense
   */
  async findApplicableWorkflow(expenseData, companyId) {
    const workflows = await this.prisma.approvalWorkflow.findMany({
      where: {
        companyId,
        isActive: true
      },
      include: { steps: { orderBy: { stepNumber: 'asc' } } }
    });

    // 1. Evaluate specific non-default workflows first
    const specificWorkflows = workflows.filter(w => !w.isDefault);
    for (const workflow of specificWorkflows) {
      // Check amount conditions
      if (workflow.minAmount && expenseData.amountInCompany < workflow.minAmount) continue;
      if (workflow.maxAmount && expenseData.amountInCompany > workflow.maxAmount) continue;
      
      // Check category conditions
      if (workflow.categories) {
        try {
          const allowedCategories = JSON.parse(workflow.categories);
          if (!allowedCategories.includes(expenseData.category)) continue;
        } catch {
          continue;
        }
      }

      return workflow; // First matching specific workflow
    }

    // 2. Fallback to default workflow if no specific matches
    const defaultWorkflow = workflows.find(w => w.isDefault);
    return defaultWorkflow || null;
  }

  /**
   * Find user by role in company
   */
  async findUserByRole(companyId, role) {
    return await this.prisma.user.findFirst({
      where: {
        companyId,
        role
      }
    });
  }

  /**
   * Log approval history
   */
  async logApprovalHistory(expenseId, action, performedBy, fromStatus, toStatus, comment) {
    return await this.prisma.approvalHistory.create({
      data: {
        expenseId,
        action,
        performedBy,
        fromStatus,
        toStatus,
        comment,
        metadata: {}
      }
    });
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovalsForUser(userId) {
    return await this.prisma.expenseApprover.findMany({
      where: {
        approverId: userId,
        isActive: true,
        status: 'PENDING'
      },
      include: {
        expense: {
          include: {
            submitter: true,
            company: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Escalate expense (for complex scenarios)
   */
  async escalateExpense(expenseId, escalatedBy, reason) {
    const originalExpense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      select: { status: true }
    });

    const expense = await this.prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'ESCALATED' }
    });

    await this.logApprovalHistory(
      expenseId,
      'ESCALATED',
      escalatedBy,
      originalExpense?.status || null,
      'ESCALATED',
      reason
    );

    return expense;
  }

  /**
   * Create default workflows for a company
   */
  async createDefaultWorkflows(companyId) {
    // Standard Sequential Workflow
    const standardWorkflow = await this.prisma.approvalWorkflow.create({
      data: {
        companyId,
        name: "Standard Sequential Approval",
        description: "Manager → Finance → Director",
        isDefault: true,
        enforceSequence: true,
        requireManager: true,
        steps: {
          create: [
            {
              stepNumber: 1,
              stepName: "Manager Approval",
              approverRole: "MANAGER",
              isManagerStep: true,
              isRequired: true
            },
            {
              stepNumber: 2,
              stepName: "Finance Review",
              approverRole: "FINANCE",
              isRequired: true
            },
            {
              stepNumber: 3,
              stepName: "Director Approval",
              approverRole: "DIRECTOR",
              isRequired: true
            }
          ]
        }
      }
    });

    return standardWorkflow;
  }

  /**
   * Create approval rules for a company
   */
  async createDefaultApprovalRules(companyId) {
    const rules = [];

    // 60% Percentage Rule
    rules.push(await this.prisma.approvalRule.create({
      data: {
        companyId,
        name: "60% Approval Rule",
        description: "Expense approved if 60% of approvers approve",
        ruleType: "PERCENTAGE",
        thresholdPct: 60,
        minimumApprovers: 2,
        priority: 1
      }
    }));

    // CFO Auto-Approval Rule
    const cfo = await this.findUserByRole(companyId, 'DIRECTOR');
    if (cfo) {
      rules.push(await this.prisma.approvalRule.create({
        data: {
          companyId,
          name: "Director Auto-Approval",
          description: "Auto-approve if Director approves",
          ruleType: "SPECIFIC_USER",
          specificUserId: cfo.id,
          canBypass: true,
          priority: 2
        }
      }));
    }

    // Hybrid Rule
    rules.push(await this.prisma.approvalRule.create({
      data: {
        companyId,
        name: "Hybrid: 60% OR Director",
        description: "Approve if 60% approvers OR Director approves",
        ruleType: "HYBRID",
        thresholdPct: 60,
        specificUserId: cfo?.id,
        priority: 3
      }
    }));

    return rules;
  }
}

// Export singleton instance
export const approvalWorkflowService = new ApprovalWorkflowService();

// Example usage scenarios
export const APPROVAL_EXAMPLES = {
  // Example 1: Simple Sequential Approval (Manager → Finance → Director)
  simpleSequential: {
    workflowName: "Standard Sequential Approval",
    enforceSequence: true,
    requireManager: true,
    steps: [
      { stepNumber: 1, approverRole: "MANAGER", stepName: "Manager Approval" },
      { stepNumber: 2, approverRole: "FINANCE", stepName: "Finance Review" },
      { stepNumber: 3, approverRole: "DIRECTOR", stepName: "Director Approval" }
    ]
  },

  // Example 2: Percentage Rule (60% approval)
  percentageRule: {
    ruleName: "60% Approval Rule",
    ruleType: "PERCENTAGE",
    thresholdPct: 60,
    minimumApprovers: 2
  },

  // Example 3: Specific Approver Rule (CFO auto-approval)
  specificApproverRule: {
    ruleName: "CFO Auto-Approval",
    ruleType: "SPECIFIC_USER",
    specificUserId: "cfo-user-id"
  },

  // Example 4: Hybrid Rule (60% OR CFO)
  hybridRule: {
    ruleName: "Hybrid: 60% OR CFO",
    ruleType: "HYBRID", 
    thresholdPct: 60,
    specificUserId: "cfo-user-id"
  }
};