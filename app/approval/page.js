'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, User, Calendar, DollarSign } from 'lucide-react'
import { useSession, SessionProvider } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Approval Dashboard</h1>
          <p className="text-gray-600 mt-2">Review and approve pending expense requests</p>
        </div>

        {/* Approvals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {drafts.map((draft) => {
            const totalApprovers = draft.approvals.length
            const approvedCount = draft.approvals.filter(a => a.status === 'approved').length
            
            return (
              <div key={draft.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  {/* Expense Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{draft.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{draft.description}</p>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {draft.status.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Expense Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <DollarSign className="text-green-600" size={16} />
                      <span className="font-semibold text-gray-900">
                        {draft.currency} {draft.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User size={16} />
                      <span>Submitted by {draft.submitter}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>{new Date(draft.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 inline-block">
                      {draft.category}
                    </div>
                  </div>

                  {/* Approval Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Approval Progress</span>
                      <span className="text-sm text-gray-600">
                        {approvedCount}/{totalApprovers} approved
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${totalApprovers > 0 ? (approvedCount / totalApprovers) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Individual Approvers Sequence List */}
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-medium text-gray-700">Approval Sequence</h4>
                    {draft.approvals.map((approval) => (
                      <div key={approval.approverId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 flex items-center justify-center">
                            {approval.status === 'approved' && <Check className="text-green-600" size={16} />}
                            {approval.status === 'rejected' && <X className="text-red-600" size={16} />}
                            {approval.status === 'pending' && <Clock className="text-yellow-600" size={16} />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{approval.name}</p>
                            <p className="text-xs text-gray-600">{approval.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                            approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {approval.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comment Input */}
                  <div className="mb-4">
                    <textarea
                      placeholder="Add a comment or explanation (optional)..."
                      value={comments[draft.id] || ''}
                      onChange={(e) => setComments(prev => ({ ...prev, [draft.id]: e.target.value }))}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      rows={2}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApprove(draft.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                    >
                      <Check size={16} />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(draft.id)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                    >
                      <X size={16} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {drafts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">No pending approvals found.</p>
          </div>
        )}
      </div>
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
