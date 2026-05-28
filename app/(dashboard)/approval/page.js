'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, User, Calendar, DollarSign, Loader2 } from 'lucide-react'
import { useSession, SessionProvider } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

function ApprovalDashboard() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState({})

  const fetchApprovals = async () => {
    try {
      const response = await fetch('/api/approval')
      if (!response.ok) {
        throw new Error('Failed to fetch pending approvals')
      }
      const data = await response.json()
      setDrafts(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to load approvals.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchApprovals()
      const interval = setInterval(fetchApprovals, 10000)
      return () => clearInterval(interval)
    }
  }, [session])

  const handleApprove = async (expenseId) => {
    try {
      const response = await fetch('/api/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId,
          decision: 'APPROVE',
          comment: comments[expenseId] || '',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve expense')
      }

      toast({
        title: 'Success',
        description: 'Expense approved successfully!',
      })
      
      // Clear comment and re-fetch list
      setComments((prev) => {
        const copy = { ...prev }
        delete copy[expenseId]
        return copy
      })
      fetchApprovals()
    } catch (error) {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (expenseId) => {
    try {
      const response = await fetch('/api/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId,
          decision: 'REJECT',
          comment: comments[expenseId] || '',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject expense')
      }

      toast({
        title: 'Success',
        description: 'Expense rejected successfully!',
      })
      
      // Clear comment and re-fetch list
      setComments((prev) => {
        const copy = { ...prev }
        delete copy[expenseId]
        return copy
      })
      fetchApprovals()
    } catch (error) {
      toast({
        title: 'Rejection Failed',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-playfair text-foreground">Approval Dashboard</h1>
        <p className="text-muted-foreground mt-2">Review and approve pending expense requests</p>
      </div>

      {/* Approvals Grid */}
      {drafts.length === 0 ? (
        <Card className="bg-white dark:bg-card border-border shadow-xl p-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">No pending approvals found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {drafts.map((draft) => {
            const totalApprovers = draft.approvals.length
            const approvedCount = draft.approvals.filter(a => a.status === 'approved').length
            const percent = totalApprovers > 0 ? (approvedCount / totalApprovers) * 100 : 0
            
            return (
              <Card key={draft.id} className="bg-white dark:bg-card border-border shadow-xl flex flex-col justify-between">
                <CardContent className="p-6 space-y-6">
                  {/* Expense Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{draft.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{draft.description || 'No description provided'}</p>
                    </div>
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 capitalize font-semibold whitespace-nowrap">
                      {draft.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                  </div>

                  {/* Expense Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm bg-secondary/20 p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <DollarSign className="text-emerald-500 h-4 w-4" />
                      <span>
                        {draft.currency} {Number(draft.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(draft.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                      <User className="h-4 w-4" />
                      <span className="truncate">Submitted by {draft.submitter}</span>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="text-xs bg-background">
                        {draft.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Approval Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Approval Progress</span>
                      <span className="font-semibold text-foreground">
                        {approvedCount}/{totalApprovers} approved
                      </span>
                    </div>
                    <Progress value={percent} className="h-2 bg-secondary" />
                  </div>

                  {/* Individual Approvers Sequence List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Approval Sequence</h4>
                    <div className="space-y-2">
                      {draft.approvals.map((approval) => (
                        <div key={approval.approverId} className="flex items-center justify-between p-3 bg-secondary/30 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 flex items-center justify-center rounded-full">
                              {approval.status === 'approved' && <Check className="text-emerald-500" size={16} />}
                              {approval.status === 'rejected' && <X className="text-destructive" size={16} />}
                              {approval.status === 'pending' && <Clock className="text-amber-500 animate-pulse" size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{approval.name}</p>
                              <p className="text-xs text-muted-foreground">{approval.role}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={
                              approval.status === 'approved' ? 'default' :
                              approval.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }
                            className={`text-xs font-semibold uppercase ${
                              approval.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
                              approval.status === 'rejected' ? 'bg-destructive/20 text-destructive border border-destructive/30' :
                              'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                            }`}
                          >
                            {approval.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="space-y-2">
                    <textarea
                      placeholder="Add a comment or explanation (optional)..."
                      value={comments[draft.id] || ''}
                      onChange={(e) => setComments(prev => ({ ...prev, [draft.id]: e.target.value }))}
                      className="w-full text-sm px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent bg-transparent text-foreground placeholder-muted-foreground"
                      rows={2}
                    />
                  </div>
                </CardContent>

                {/* Action Buttons */}
                <div className="p-6 pt-0 flex gap-4 border-t border-border mt-auto">
                  <Button
                    onClick={() => handleApprove(draft.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 mt-4"
                  >
                    <Check size={16} />
                    <span>Approve</span>
                  </Button>
                  <Button
                    onClick={() => handleReject(draft.id)}
                    className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-semibold flex items-center justify-center gap-2 mt-4"
                  >
                    <X size={16} />
                    <span>Reject</span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ApprovalDashboardPage() {
  return (
    <SessionProvider basePath="/api/auth">
      <ApprovalDashboard />
    </SessionProvider>
  )
}
