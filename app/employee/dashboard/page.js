'use client'

import { useSession, SessionProvider } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ExpenseSubmissionForm from '@/components/ExpenseSubmissionForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Calendar, Settings, FileText } from 'lucide-react'

function EmployeeDashboardClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [recentExpenses, setRecentExpenses] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    // If not an employee, send to existing dashboard
    if (session.user?.role && session.user.role !== 'EMPLOYEE') {
      router.push('/dashboard')
      return
    }

    // Fetch recent expenses
    const fetchRecentExpenses = async () => {
      try {
        const response = await fetch('/api/expenses/recent')
        if (response.ok) {
          const data = await response.json()
          setRecentExpenses(data)
        }
      } catch (error) {
        console.error('Failed to fetch recent expenses:', error)
      } finally {
        setLoading(false)
      }
    }

    // Fetch user profile details
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
      }
    }

    fetchRecentExpenses()
    fetchProfile()
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header - match existing dashboard styling */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {session.user?.name || 'Employee'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here’s what’s happening with your expenses today.
          </p>
        </div>

        {/* Info cards - same grid and components as dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session.user?.name || 'Employee'}</div>
              <p className="text-xs text-muted-foreground">{session.user?.email}</p>
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
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Today'}
              </div>
              <p className="text-xs text-muted-foreground">Welcome to the platform!</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - same look */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                <Settings className="h-8 w-8 mb-2" />
                <span>Settings</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                <Calendar className="h-8 w-8 mb-2" />
                <span>View Calendar</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center" onClick={() => document.getElementById('submit-expense-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <FileText className="h-8 w-8 mb-2" />
                <span>Submit Expense</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center" onClick={() => alert('Messages feature coming soon!')}>
                <Mail className="h-8 w-8 mb-2" />
                <span>Messages</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit Expense - embeds existing form component */}
        <div id="submit-expense-section" className="mb-8">
          <ExpenseSubmissionForm />
        </div>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Your latest submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses submitted yet.</p>
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
                    {recentExpenses.map((e) => (
                      <tr key={e.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-4">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="py-2 pr-4">{e.category}</td>
                        <td className="py-2 pr-4 font-medium">{e.currency} {Number(e.amount).toFixed(2)}</td>
                        <td className="py-2 pr-4 truncate max-w-[24ch]" title={e.description || ''}>{e.description || '—'}</td>
                        <td className="py-2 pr-0">
                          <Badge variant={e.status === 'APPROVED' ? 'default' : e.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                            {e.status}
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
      </div>
    </div>
  )
}

export default function EmployeeDashboard() {
  return (
    <SessionProvider basePath="/api/auth">
      <EmployeeDashboardClient />
    </SessionProvider>
  )
}
