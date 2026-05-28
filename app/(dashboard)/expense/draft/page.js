'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPendingExpenses, processDraftExpenses } from './action'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  Clock, 
  Send, 
  Trash2, 
  AlertCircle, 
  FileText, 
  CheckCircle 
} from 'lucide-react'

const statusBadgeVariant = {
  PENDING: 'secondary',
  IN_PROGRESS: 'secondary',
}

export default function DraftsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'offline'
  const [pendingExpenses, setPendingExpenses] = useState([])
  const [offlineDrafts, setOfflineDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      loadData(true)
      const interval = setInterval(() => {
        loadData(false)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [status, router])

  const loadData = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    setMessage({ type: '', text: '' })
    
    // 1. Fetch pending claims from DB
    try {
      const res = await getPendingExpenses()
      if (res.success) {
        setPendingExpenses(res.expenses)
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to fetch pending expenses.' })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error loading pending claims.' })
    }

    // 2. Fetch offline drafts from localStorage
    try {
      const localData = localStorage.getItem('draft_expenses')
      if (localData) {
        const parsed = JSON.parse(localData)
        if (Array.isArray(parsed)) {
          setOfflineDrafts(parsed)
        }
      }
    } catch (err) {
      console.error('Failed to parse offline drafts:', err)
    }

    if (showLoader) setLoading(false)
  }

  const handleClearOfflineDrafts = () => {
    localStorage.removeItem('draft_expenses')
    setOfflineDrafts([])
    setMessage({ type: 'success', text: 'Offline drafts cleared.' })
  }

  const handleSubmitOfflineDrafts = async () => {
    if (offlineDrafts.length === 0) return
    setActionLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await processDraftExpenses(offlineDrafts, {
        companyId: session.user.companyId,
        submittedById: session.user.id
      })

      if (result.success) {
        setMessage({ type: 'success', text: `Successfully submitted ${offlineDrafts.length} drafts!` })
        localStorage.removeItem('draft_expenses')
        setOfflineDrafts([])
        // Refresh db pending expenses
        const res = await getPendingExpenses()
        if (res.success) {
          setPendingExpenses(res.expenses)
        }
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to submit drafts.' })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'An unexpected error occurred during submission.' })
    } finally {
      setActionLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-playfair text-foreground">My Drafts & Claims</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your offline scans and claims currently in the approval queue.
          </p>
        </div>
        <Link href="/expense">
          <Button className="bg-accent hover:bg-accent/90 text-white font-semibold">
            <FileText className="mr-2 h-4 w-4" />
            Scan New Receipt
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-8">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Pending Queue ({pendingExpenses.length})
        </button>
        <button
          onClick={() => setActiveTab('offline')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'offline'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Offline Drafts ({offlineDrafts.length})
          {offlineDrafts.length > 0 && (
            <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg border flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Content */}
      {activeTab === 'pending' ? (
        <Card className="bg-white dark:bg-card border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Claims In Review</CardTitle>
            <CardDescription>Expenses currently routing through the sequential approval steps.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              {pendingExpenses.length === 0 ? (
                <div className="p-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-md font-medium">No pending claims in the queue.</p>
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
                    {pendingExpenses.map((expense) => (
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
                          <Badge variant={statusBadgeVariant[expense.status] || 'secondary'} className="font-semibold capitalize">
                            {expense.status.replace('_', ' ').toLowerCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {offlineDrafts.length > 0 && (
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={handleClearOfflineDrafts}
                disabled={actionLoading}
                className="bg-white dark:bg-background border-destructive text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
              <Button
                onClick={handleSubmitOfflineDrafts}
                disabled={actionLoading}
                className="bg-accent hover:bg-accent/90 text-white font-semibold"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit All ({offlineDrafts.length})
                  </>
                )}
              </Button>
            </div>
          )}

          <Card className="bg-white dark:bg-card border-border shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Offline Scans</CardTitle>
              <CardDescription>
                Receipts scanned or saved to local storage when you are offline or preparing batch uploads.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="overflow-x-auto">
                {offlineDrafts.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-md font-medium">No offline drafts found.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      When you scan receipts, they can be queued locally before sending them for workflow approval.
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-secondary/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {offlineDrafts.map((draft, idx) => (
                        <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {draft.transaction_date ? new Date(draft.transaction_date).toLocaleDateString() : 'Today'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium border">
                              {draft.category || 'General'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                            {draft.currency || 'USD'} {Number(draft.total_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground max-w-[30ch] truncate">
                            {draft.description || 'Offline Scanned Receipt'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
