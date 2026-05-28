import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { approvalWorkflowService } from '@/lib/approval-workflow'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const approvals = await prisma.expenseApprover.findMany({
      where: {
        approverId: session.user.id,
        status: 'PENDING',
        isActive: true,
      },
      include: {
        expense: {
          include: {
            submitter: {
              select: { name: true, email: true },
            },
            approvers: {
              include: {
                approver: {
                  select: { name: true, role: true },
                },
              },
              orderBy: { sequenceOrder: 'asc' },
            },
          },
        },
      },
    })

    // Format data for the dashboard layout
    const formatted = approvals.map((app) => ({
      id: app.expense.id,
      title: app.expense.description || `${app.expense.category} Expense`,
      description: app.expense.description || 'No description provided.',
      amount: app.expense.amount,
      currency: app.expense.currency,
      submitter: app.expense.submitter?.name || app.expense.submitter?.email || 'Unknown User',
      submittedAt: app.expense.createdAt.toISOString(),
      status: app.expense.status,
      category: app.expense.category,
      currentStep: app.expense.currentStep,
      approverStepId: app.id,
      approvals: app.expense.approvers.map((a) => ({
        approverId: a.approverId,
        name: a.approver?.name || 'Unknown',
        role: a.approver?.role || 'Approver',
        status: a.status.toLowerCase(),
        isActive: a.isActive,
        sequenceOrder: a.sequenceOrder,
        timestamp: a.notifiedAt ? a.notifiedAt.toISOString() : null,
      })),
    }))

    return NextResponse.json(formatted, { status: 200 })
  } catch (error) {
    console.error('Fetch approvals error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { expenseId, decision, comment } = await request.json()
    if (!expenseId || !decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      return NextResponse.json({ error: 'Invalid decision type' }, { status: 400 })
    }

    const result = await approvalWorkflowService.processApproval(
      expenseId,
      session.user.id,
      decision,
      comment || ''
    )

    return NextResponse.json({ success: true, expense: result }, { status: 200 })
  } catch (error) {
    console.error('Submit approval error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
