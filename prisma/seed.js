const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const DEMO_PASSWORD = 'Demo@1234'

function daysAgo(days, hour = 12) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  date.setUTCHours(hour, 0, 0, 0)
  return date
}

function item(name, quantity, price) {
  return { itemName: name, quantity, price: price.toFixed(2) }
}

async function createExpense({
  companyId,
  submitter,
  workflowId,
  amount,
  currency,
  category,
  description,
  date,
  status,
  isManager,
  currentStep,
  items,
  history,
  approvers,
}) {
  return prisma.expense.create({
    data: {
      companyId,
      submittedById: submitter.id,
      amount,
      currency,
      amountInCompany: amount,
      category,
      description,
      date,
      status,
      isManager,
      currentStep,
      workflowId,
      items,
      approvers: approvers
        ? {
            create: approvers,
          }
        : undefined,
      approvalHistory: {
        create: history,
      },
    },
  })
}

async function clearDatabase() {
  await prisma.approvalHistory.deleteMany()
  await prisma.approvalDecision.deleteMany()
  await prisma.expenseApprover.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.approvalWorkflowStep.deleteMany()
  await prisma.approvalWorkflow.deleteMany()
  await prisma.approvalRule.deleteMany()
  await prisma.employeeManager.deleteMany()
  await prisma.companySetting.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.company.deleteMany()
  await prisma.receiptOCR.deleteMany()
}

async function main() {
  const shouldReset = process.env.SEED_RESET !== 'false'

  if (shouldReset) {
    await clearDatabase()
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  const company = await prisma.company.create({
    data: {
      id: 'DEMO-ACME',
      name: 'Northwind Demo Systems',
      country: 'US',
      currency: 'USD',
      description: 'Demo services company for expense workflow testing',
      industry: 'Professional Services',
    },
  })

  await prisma.companySetting.create({
    data: {
      companyId: company.id,
      approvalRequired: true,
      managerApprovalFirst: true,
      sequentialApproval: true,
    },
  })

  const admin = await prisma.user.create({
    data: {
      name: 'Avery Admin',
      email: 'admin@demo.com',
      password: passwordHash,
      role: 'ADMIN',
      companyId: company.id,
    },
  })

  const director = await prisma.user.create({
    data: {
      name: 'Diana Director',
      email: 'director@demo.com',
      password: passwordHash,
      role: 'DIRECTOR',
      companyId: company.id,
    },
  })

  const finance = await prisma.user.create({
    data: {
      name: 'Felix Finance',
      email: 'finance@demo.com',
      password: passwordHash,
      role: 'FINANCE',
      companyId: company.id,
    },
  })

  const manager = await prisma.user.create({
    data: {
      name: 'Maya Manager',
      email: 'manager@demo.com',
      password: passwordHash,
      role: 'MANAGER',
      companyId: company.id,
    },
  })

  const employee = await prisma.user.create({
    data: {
      name: 'Ethan Engineer',
      email: 'employee@demo.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      companyId: company.id,
    },
  })

  const sales = await prisma.user.create({
    data: {
      name: 'Sara Sales',
      email: 'sales@demo.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      companyId: company.id,
    },
  })

  const ops = await prisma.user.create({
    data: {
      name: 'Owen Operations',
      email: 'ops@demo.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      companyId: company.id,
    },
  })

  const intern = await prisma.user.create({
    data: {
      name: 'Ivy Intern',
      email: 'intern@demo.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      companyId: company.id,
    },
  })

  await prisma.employeeManager.createMany({
    data: [
      { employeeId: employee.id, managerId: manager.id },
      { employeeId: sales.id, managerId: manager.id },
      { employeeId: ops.id, managerId: manager.id },
      { employeeId: intern.id, managerId: employee.id },
      { employeeId: manager.id, managerId: director.id },
      { employeeId: finance.id, managerId: director.id },
    ],
  })

  const standardWorkflow = await prisma.approvalWorkflow.create({
    data: {
      companyId: company.id,
      name: 'Standard Sequential Approval',
      description: 'Manager → Finance → Director',
      isDefault: true,
      enforceSequence: true,
      requireManager: true,
      steps: {
        create: [
          {
            stepNumber: 1,
            stepName: 'Manager Approval',
            approverRole: 'MANAGER',
            isManagerStep: true,
            isRequired: true,
          },
          {
            stepNumber: 2,
            stepName: 'Finance Review',
            approverRole: 'FINANCE',
            isRequired: true,
          },
          {
            stepNumber: 3,
            stepName: 'Director Approval',
            approverRole: 'DIRECTOR',
            isRequired: true,
          },
        ],
      },
    },
  })

  const fastTrackWorkflow = await prisma.approvalWorkflow.create({
    data: {
      companyId: company.id,
      name: 'Fast Track Under $100',
      description: 'Manager review for low-value operational expenses',
      isDefault: false,
      enforceSequence: true,
      requireManager: true,
      minAmount: 0,
      maxAmount: 100,
      categories: JSON.stringify(['Meals & Entertainment', 'Office Supplies', 'Travel']),
      steps: {
        create: [
          {
            stepNumber: 1,
            stepName: 'Manager Approval',
            approverRole: 'MANAGER',
            isManagerStep: true,
            isRequired: true,
          },
        ],
      },
    },
  })

  await prisma.approvalRule.createMany({
    data: [
      {
        companyId: company.id,
        name: 'Manager approval first',
        description: 'All expenses must pass through the manager before finance review',
        ruleType: 'SEQUENTIAL',
        minimumApprovers: 1,
        priority: 1,
      },
      {
        companyId: company.id,
        name: 'Director approval over $1,000',
        description: 'Large expenses require final director approval',
        ruleType: 'CONDITIONAL',
        minAmount: 1000,
        currency: 'USD',
        minimumApprovers: 3,
        priority: 2,
      },
    ],
  })

  await createExpense({
    companyId: company.id,
    submitter: employee,
    workflowId: standardWorkflow.id,
    amount: 42.75,
    currency: 'USD',
    category: 'Meals & Entertainment',
    description: 'Client lunch after kickoff meeting',
    date: daysAgo(6),
    status: 'PENDING',
    isManager: false,
    currentStep: 1,
    items: [item('Lunch for 3 attendees', 1, 42.75)],
    approvers: [
      {
        approverId: manager.id,
        sequenceOrder: 1,
        isManager: true,
        isRequired: true,
        isActive: true,
        canBypass: false,
        status: 'PENDING',
      },
      {
        approverId: finance.id,
        sequenceOrder: 2,
        isRequired: true,
        isActive: false,
        canBypass: false,
        status: 'PENDING',
      },
      {
        approverId: director.id,
        sequenceOrder: 3,
        isRequired: true,
        isActive: false,
        canBypass: false,
        status: 'PENDING',
      },
    ],
    history: [
      {
        action: 'SUBMITTED',
        performedBy: employee.id,
        fromStatus: null,
        toStatus: 'PENDING',
        comment: 'Submitted after meeting with a prospect',
        metadata: { seed: true },
      },
    ],
  })

  await createExpense({
    companyId: company.id,
    submitter: manager,
    workflowId: standardWorkflow.id,
    amount: 1280.0,
    currency: 'USD',
    category: 'Travel',
    description: 'Quarterly strategy offsite travel and hotel',
    date: daysAgo(14),
    status: 'APPROVED',
    isManager: true,
    currentStep: null,
    items: [item('Hotel', 1, 980), item('Flight', 1, 300)],
    approvers: [
      {
        approverId: director.id,
        sequenceOrder: 1,
        isRequired: true,
        isActive: true,
        canBypass: false,
        status: 'APPROVED',
      },
      {
        approverId: finance.id,
        sequenceOrder: 2,
        isRequired: true,
        isActive: true,
        canBypass: false,
        status: 'APPROVED',
      },
    ],
    history: [
      {
        action: 'SUBMITTED',
        performedBy: manager.id,
        fromStatus: null,
        toStatus: 'PENDING',
        comment: 'Conference travel for leadership planning',
        metadata: { seed: true },
      },
      {
        action: 'APPROVED',
        performedBy: finance.id,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'APPROVED',
        comment: 'Receipts are complete and within policy',
        metadata: { seed: true },
      },
    ],
  })

  await createExpense({
    companyId: company.id,
    submitter: sales,
    workflowId: fastTrackWorkflow.id,
    amount: 86.4,
    currency: 'USD',
    category: 'Meals & Entertainment',
    description: 'Dinner with prospect at airport hotel',
    date: daysAgo(3),
    status: 'AUTO_APPROVED',
    isManager: false,
    currentStep: null,
    items: [item('Dinner', 2, 38.2), item('Coffee', 2, 5)],
    approvers: [
      {
        approverId: manager.id,
        sequenceOrder: 1,
        isManager: true,
        isRequired: true,
        isActive: true,
        canBypass: false,
        status: 'APPROVED',
      },
    ],
    history: [
      {
        action: 'SUBMITTED',
        performedBy: sales.id,
        fromStatus: null,
        toStatus: 'PENDING',
        comment: 'Low-value meal should fast-track',
        metadata: { seed: true },
      },
      {
        action: 'AUTO_APPROVED',
        performedBy: finance.id,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'AUTO_APPROVED',
        comment: 'Under threshold and matched policy',
        metadata: { seed: true },
      },
    ],
  })

  await createExpense({
    companyId: company.id,
    submitter: ops,
    workflowId: standardWorkflow.id,
    amount: 75.5,
    currency: 'USD',
    category: 'Software & Technology',
    description: 'Project management subscription renewal',
    date: daysAgo(10),
    status: 'REJECTED',
    isManager: false,
    currentStep: null,
    items: [item('Subscription', 1, 75.5)],
    history: [
      {
        action: 'SUBMITTED',
        performedBy: ops.id,
        fromStatus: null,
        toStatus: 'PENDING',
        comment: 'Submitted for tooling renewal',
        metadata: { seed: true },
      },
      {
        action: 'REJECTED',
        performedBy: finance.id,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'REJECTED',
        comment: 'Duplicate subscription already active',
        metadata: { seed: true },
      },
    ],
  })

  await createExpense({
    companyId: company.id,
    submitter: intern,
    workflowId: fastTrackWorkflow.id,
    amount: 29.95,
    currency: 'USD',
    category: 'Office Supplies',
    description: 'Notebook and pens for onboarding week',
    date: daysAgo(1),
    status: 'PENDING',
    isManager: false,
    currentStep: 1,
    items: [item('Notebook', 1, 14.95), item('Pens', 1, 15)],
    approvers: [
      {
        approverId: employee.id,
        sequenceOrder: 1,
        isManager: true,
        isRequired: true,
        isActive: true,
        canBypass: false,
        status: 'PENDING',
      },
    ],
    history: [
      {
        action: 'SUBMITTED',
        performedBy: intern.id,
        fromStatus: null,
        toStatus: 'PENDING',
        comment: 'First reimbursement request',
        metadata: { seed: true },
      },
    ],
  })

  await prisma.receiptOCR.createMany({
    data: [
      {
        text: 'Invoice #4581 | Demo Hotel | $980.00 | 2 nights stay',
        parsedJson: {
          vendor: 'Demo Hotel',
          amount: 980,
          currency: 'USD',
          category: 'Travel',
        },
      },
      {
        text: 'Receipt | Northwind Cafe | $42.75 | team lunch',
        parsedJson: {
          vendor: 'Northwind Cafe',
          amount: 42.75,
          currency: 'USD',
          category: 'Meals & Entertainment',
        },
      },
    ],
  })

  console.log('Seed completed for company:', company.id)
  console.log(`Demo password: ${DEMO_PASSWORD}`)
  console.log('Demo logins:')
  console.log('- admin@demo.com')
  console.log('- director@demo.com')
  console.log('- finance@demo.com')
  console.log('- manager@demo.com')
  console.log('- employee@demo.com')
  console.log('- sales@demo.com')
  console.log('- ops@demo.com')
  console.log('- intern@demo.com')
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })