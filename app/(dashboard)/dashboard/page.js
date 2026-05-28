import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import AdminDashboard from '@/components/AdminDashboard'
import AutoRefresh from '@/components/AutoRefresh'
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

  if (role === 'ADMIN') {
    return <AdminDashboard />
  }

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

  const [expenses, pendingCount, approvedCount, rejectedCount, dbUser, spendSum, company] = await Promise.all([
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
    }),
    prisma.expense.aggregate({
      where: { ...expenseWhere, status: { in: ['APPROVED', 'AUTO_APPROVED'] } },
      _sum: { amount: true, amountInCompany: true }
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { currency: true }
    })
  ])

  const totalSpend = spendSum._sum.amountInCompany || spendSum._sum.amount || 0
  const companyCurrency = company?.currency || 'USD'

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AutoRefresh interval={10000} />
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-playfair text-foreground">
            Welcome back, {session.user?.name || 'User'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here&apos;s what is happening with your expenses today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground self-start md:self-center">
          <Badge variant="secondary" className="bg-accent/10 text-accent font-semibold border-accent/20 px-3 py-1">
            {session.user.role}
          </Badge>
          <span className="text-muted-foreground">|</span>
          <span>Company ID: {session.user.companyId}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Pending Card */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending Reviews</p>
              <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
            </div>
            <div className="bg-amber-500/20 p-3 rounded-xl">
              <Clock3 className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </Card>

        {/* Approved Card */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Resolved</p>
              <p className="text-3xl font-bold text-foreground">{approvedCount}</p>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-xl">
              <CircleCheckBig className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </Card>

        {/* Rejected Card */}
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Rejected</p>
              <p className="text-3xl font-bold text-foreground">{rejectedCount}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-xl">
              <CircleSlash className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </Card>

        {/* Spend Card */}
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Approved Spend</p>
              <p className="text-3xl font-bold text-foreground">
                {companyCurrency} {Number(totalSpend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-indigo-500/20 p-3 rounded-xl">
              <ReceiptText className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-card border-border shadow-xl">
        <div className="p-6 border-b border-border">
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-1">
            Recent Expenses
          </h2>
          <p className="text-sm text-muted-foreground">
            Recent activity from your expense tracking scope.
          </p>
        </div>
        <div className="overflow-x-auto">
          {expenses.length === 0 ? (
            <div className="p-12 text-center">
              <ReceiptText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No expenses yet.</p>
              <Link href="/expense">
                <Button className="bg-accent hover:bg-accent/90 text-white mt-4">
                  Submit First Expense
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium border">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                      {expense.currency} {Number(expense.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[30ch] truncate" title={expense.description || ''}>
                      {expense.description || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant={statusBadgeVariant[expense.status] || 'secondary'} className="font-semibold">
                        {expense.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}