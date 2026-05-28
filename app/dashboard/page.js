import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Calendar,
  Settings,
  ReceiptText,
  ClipboardList,
  ShieldCheck,
  Users,
  FileSpreadsheet,
  ArrowRight,
  Clock3,
  CircleCheckBig,
  CircleSlash,
} from 'lucide-react'

const roleTiles = {
  ADMIN: [
    { title: 'Manage Employees', description: 'Add users, send passwords, and assign managers.', href: '/admin/dashboard', icon: Users },
    { title: 'Review Approvals', description: 'Monitor approval queues and policy decisions.', href: '/approval', icon: ClipboardList },
    { title: 'Company Setup', description: 'Update onboarding and company settings.', href: '/onboard', icon: ShieldCheck },
  ],
  MANAGER: [
    { title: 'Submit Expense', description: 'Create a new reimbursement request.', href: '/expense', icon: ReceiptText },
    { title: 'Check Approvals', description: 'Review expenses waiting on your approval.', href: '/approval', icon: ClipboardList },
    { title: 'View Team Activity', description: 'Track your team’s recent submissions.', href: '/dashboard/manager', icon: Users },
  ],
  FINANCE: [
    { title: 'Review Expense Queue', description: 'See expenses moving through finance review.', href: '/approval', icon: ClipboardList },
    { title: 'Audit Submissions', description: 'Inspect recent expense history and statuses.', href: '/dashboard/finance', icon: FileSpreadsheet },
    { title: 'Open Reports', description: 'Spot trends in spend and policy exceptions.', href: '/dashboard', icon: ShieldCheck },
  ],
  DIRECTOR: [
    { title: 'Finalize High Value Claims', description: 'Approve larger expenses and exceptions.', href: '/approval', icon: ClipboardList },
    { title: 'Company Overview', description: 'View summary data for the org.', href: '/dashboard', icon: FileSpreadsheet },
    { title: 'Team Access', description: 'Jump to admin employee controls.', href: '/admin/dashboard', icon: Users },
  ],
  EMPLOYEE: [
    { title: 'Submit Expense', description: 'Capture a new receipt and file reimbursement.', href: '/expense', icon: ReceiptText },
    { title: 'My Drafts', description: 'Continue unfinished expense drafts.', href: '/expense/draft', icon: Clock3 },
    { title: 'Recent Activity', description: 'Check your latest submissions and outcomes.', href: '/employee/dashboard', icon: FileSpreadsheet },
  ],
}

const statusBadgeVariant = {
  APPROVED: 'default',
  REJECTED: 'destructive',
  PENDING: 'secondary',
  IN_PROGRESS: 'secondary',
  PARTIALLY_APPROVED: 'outline',
  ESCALATED: 'destructive',
  AUTO_APPROVED: 'default',
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const companyId = session.user.companyId
  const role = session.user.role

  // Role-based filtering for expenses
  let expenseWhere = { companyId }
  if (role === 'EMPLOYEE') {
    expenseWhere.submittedById = session.user.id
  } else if (role === 'MANAGER') {
    const teamMembers = await prisma.employeeManager.findMany({
      where: { managerId: session.user.id },
      select: { employeeId: true }
    })
    const teamMemberIds = teamMembers.map(tm => tm.employeeId)
    expenseWhere.submittedById = { in: [...teamMemberIds, session.user.id] }
  }

  const [expenses, pendingCount, approvedCount, rejectedCount, dbUser] = await Promise.all([
    prisma.expense.findMany({
      where: expenseWhere,
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        currency: true,
        category: true,
        description: true,
        date: true,
        status: true,
      },
    }),
    prisma.expense.count({ where: { ...expenseWhere, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.expense.count({ where: { ...expenseWhere, status: { in: ['APPROVED', 'AUTO_APPROVED'] } } }),
    prisma.expense.count({ where: { ...expenseWhere, status: 'REJECTED' } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true }
    })
  ])

  const tiles = roleTiles[session.user.role] || roleTiles.EMPLOYEE

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {session.user?.name || 'User'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here&apos;s what you can actually do in ExpenseFlow today.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{session.user.role}</Badge>
            <span>Company: {session.user.companyId}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session.user?.name || 'User'}</div>
              <p className="text-xs text-muted-foreground">
                {session.user?.email}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Waiting in the approval queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CircleCheckBig className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Approved or auto-approved expenses</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <CircleSlash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <p className="text-xs text-muted-foreground">Needs attention or re-submission</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Status</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">Email verified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Since</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Today'}
              </div>
              <p className="text-xs text-muted-foreground">Welcome to the platform!</p>
            </CardContent>
          </Card>
        </div>

        {/* Real Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Visible Features</CardTitle>
            <CardDescription>These are the core areas users can access right now.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiles.map((tile) => {
                const Icon = tile.icon
                return (
                  <Link key={tile.title} href={tile.href}>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start w-full text-left">
                      <Icon className="h-6 w-6 mb-3" />
                      <span className="font-semibold">{tile.title}</span>
                      <span className="text-xs text-muted-foreground mt-1">{tile.description}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Company Expenses</CardTitle>
            <CardDescription>Recent activity from your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses yet. Start by submitting one from the expense page.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Description</th>
                      <th className="py-2 pr-0">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-4">{new Date(expense.date).toLocaleDateString()}</td>
                        <td className="py-2 pr-4">{expense.category}</td>
                        <td className="py-2 pr-4 font-medium">{expense.currency} {Number(expense.amount).toFixed(2)}</td>
                        <td className="py-2 pr-4 truncate max-w-[28ch]" title={expense.description || ''}>{expense.description || '—'}</td>
                        <td className="py-2 pr-0">
                          <Badge variant={statusBadgeVariant[expense.status] || 'secondary'}>
                            {expense.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Shortcuts</CardTitle>
              <CardDescription>Jump straight to the area that matters for your role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tiles.map((tile) => (
                <div key={tile.title} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{tile.title}</p>
                    <p className="text-sm text-muted-foreground">{tile.description}</p>
                  </div>
                  <Link href={tile.href}>
                    <Button size="sm" variant="ghost" className="gap-2">
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What’s live now</CardTitle>
              <CardDescription>These features are already wired up in the app.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>• Receipt upload and expense submission</li>
                <li>• Recent expenses API for employee history</li>
                <li>• Approval workflow and review pages</li>
                <li>• Admin employee management and password sending</li>
                <li>• Demo login shortcuts on the sign-in page</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}