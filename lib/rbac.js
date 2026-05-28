// Role-Based Access Control (RBAC) Utility
// Provides middleware and utilities for checking permissions

import { ROLES, ROLE_PERMISSIONS, hasPermission, UI_PERMISSIONS } from './roles';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from './prisma';
import { NextResponse } from 'next/server';

/**
 * Get user session with role information
 */
export async function getUserSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      company: true,
      reportsTo: { include: { manager: true } },
      managerOf: { include: { employee: true } }
    }
  });

  return {
    ...session,
    user: {
      ...session.user,
      ...user
    }
  };
}

/**
 * Check if user has specific permission
 */
export function checkPermission(userRole, category, permission) {
  return hasPermission(userRole, category, permission);
}

/**
 * Middleware to require authentication
 */
export function requireAuth(handler) {
  return async (req, ...args) => {
    const session = await getUserSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    req.session = session;
    return handler(req, ...args);
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(requiredRole) {
  return (handler) => {
    return async (req, ...args) => {
      const session = await getUserSession();
      
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (session.user.role !== requiredRole) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      
      req.session = session;
      return handler(req, ...args);
    };
  };
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(category, permission) {
  return (handler) => {
    return async (req, ...args) => {
      const session = await getUserSession();
      
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (!checkPermission(session.user.role, category, permission)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      
      req.session = session;
      return handler(req, ...args);
    };
  };
}

/**
 * Check if user can approve expenses
 */
export function canUserApproveExpenses(userRole) {
  return checkPermission(userRole, 'approvals', 'approveReject') ||
         checkPermission(userRole, 'approvals', 'highValueApprovals');
}

/**
 * Check if user can view all expenses
 */
export function canUserViewAllExpenses(userRole) {
  return checkPermission(userRole, 'expenses', 'viewAll');
}

/**
 * Check if user can manage other users
 */
export function canUserManageUsers(userRole) {
  return checkPermission(userRole, 'users', 'create') &&
         checkPermission(userRole, 'users', 'assignRoles');
}

/**
 * Check if user is manager of another user
 */
export async function isManagerOf(managerId, employeeId) {
  const relationship = await prisma.employeeManager.findFirst({
    where: {
      managerId,
      employeeId
    }
  });
  
  return !!relationship;
}

/**
 * Get team members for a manager
 */
export async function getTeamMembers(managerId) {
  const relationships = await prisma.employeeManager.findMany({
    where: { managerId },
    include: {
      employee: true
    }
  });
  
  return relationships.map(rel => rel.employee);
}

/**
 * Get manager for an employee
 */
export async function getManager(employeeId) {
  const relationship = await prisma.employeeManager.findFirst({
    where: { employeeId },
    include: { manager: true }
  });
  
  return relationship?.manager;
}

/**
 * Check if user can access specific expense
 */
export async function canAccessExpense(userId, userRole, expenseId) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      submitter: true,
      approvers: true
    }
  });
  
  if (!expense) return false;
  
  // Own expense
  if (expense.submittedById === userId) return true;
  
  // Admin/Finance/Director can see all
  if (['ADMIN', 'FINANCE', 'DIRECTOR'].includes(userRole)) return true;
  
  // Manager can see team member expenses
  if (userRole === 'MANAGER') {
    const isManager = await isManagerOf(userId, expense.submittedById);
    if (isManager) return true;
  }
  
  // Approver can see assigned expenses
  const isApprover = expense.approvers.some(a => a.approverId === userId);
  if (isApprover) return true;
  
  return false;
}

/**
 * Filter expenses based on user role and permissions
 */
export async function getAccessibleExpenses(userId, userRole, companyId) {
  let whereCondition = { companyId };
  
  if (userRole === 'EMPLOYEE') {
    // Employees can only see their own expenses
    whereCondition.submittedById = userId;
  } else if (userRole === 'MANAGER') {
    // Managers can see their own + team member expenses
    const teamMembers = await getTeamMembers(userId);
    const teamMemberIds = teamMembers.map(member => member.id);
    
    whereCondition.OR = [
      { submittedById: userId }, // Own expenses
      { submittedById: { in: teamMemberIds } }, // Team member expenses
      { approvers: { some: { approverId: userId } } } // Assigned for approval
    ];
  }
  // ADMIN, FINANCE, DIRECTOR can see all (no additional filter needed)
  
  return await prisma.expense.findMany({
    where: whereCondition,
    include: {
      submitter: true,
      approvers: { include: { approver: true } },
      company: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Get UI permissions for user
 */
export function getUIPermissions(userRole) {
  return UI_PERMISSIONS[userRole] || {};
}

/**
 * Create admin user on company creation
 */
export async function createAdminUser(email, name, hashedPassword, companyId) {
  return await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'ADMIN',
      companyId
    }
  });
}

/**
 * Create employee-manager relationship
 */
export async function assignManager(employeeId, managerId) {
  // Remove existing manager relationship
  await prisma.employeeManager.deleteMany({
    where: { employeeId }
  });
  
  // Create new relationship
  return await prisma.employeeManager.create({
    data: {
      employeeId,
      managerId
    }
  });
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(role) {
  const hierarchy = {
    'EMPLOYEE': 1,
    'MANAGER': 2,
    'FINANCE': 3,
    'ADMIN': 4,
    'DIRECTOR': 5
  };
  
  return hierarchy[role] || 0;
}

/**
 * Check if user can assign role
 */
export function canAssignRole(assignerRole, targetRole) {
  const assignerLevel = getRoleLevel(assignerRole);
  const targetLevel = getRoleLevel(targetRole);
  
  // Only admins can assign roles, and they can't assign roles higher than their own
  return assignerRole === 'ADMIN' && targetLevel <= assignerLevel;
}

/**
 * Get available roles for assignment
 */
export function getAssignableRoles(assignerRole) {
  if (assignerRole !== 'ADMIN') return [];
  
  return ['EMPLOYEE', 'MANAGER', 'FINANCE'];
}

/**
 * Initialize company with default settings
 */
export async function initializeCompany(companyId) {
  // Create company settings
  const settings = await prisma.companySetting.create({
    data: {
      companyId,
      approvalRequired: true,
      managerApprovalFirst: true,
      sequentialApproval: true
    }
  });
  
  return settings;
}

/**
 * Component wrapper to check permissions
 */
export function withPermission(Component, requiredCategory, requiredPermission) {
  return function PermissionWrapper(props) {
    // This would be used in React components
    const { session } = props;
    
    if (!session?.user || !checkPermission(session.user.role, requiredCategory, requiredPermission)) {
      return <div>Access Denied</div>;
    }
    
    return <Component {...props} />;
  };
}

/**
 * Server-side permission check for pages
 */
export async function checkPageAccess(requiredCategory, requiredPermission) {
  const session = await getUserSession();
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  
  if (!checkPermission(session.user.role, requiredCategory, requiredPermission)) {
    return {
      redirect: {
        destination: '/unauthorized',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      session
    }
  };
}