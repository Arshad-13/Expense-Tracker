'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Receipt, DollarSign, Calendar, FileText, Send, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCurrencies } from '@/hooks/use-currencies'

// Common expense categories
const EXPENSE_CATEGORIES = [
  'Travel',
  'Meals & Entertainment',
  'Office Supplies',
  'Software & Technology',
  'Transportation',
  'Training & Education',
  'Marketing',
  'Communications',
  'Professional Services',
  'Other'
]

export default function ExpenseSubmissionForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { currencies, loading: loadingCurrencies } = useCurrencies()
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: session?.user?.company?.currency || 'USD',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    receiptFile: null,
    isManager: false
  })

  useEffect(() => {
    if (session?.user?.role) {
      setFormData(prev => ({
        ...prev,
        isManager: session.user.role === 'MANAGER'
      }))
    }
  }, [session])
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [dragActive, setDragActive] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!formData.date) {
      newErrors.date = 'Date is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileChange = (file) => {
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      const maxSize = 5 * 1024 * 1024 // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPG, PNG, or PDF file",
          variant: "destructive",
        })
        return
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        })
        return
      }
      
      setFormData(prev => ({ ...prev, receiptFile: file }))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('amount', formData.amount)
      submitData.append('currency', formData.currency)
      submitData.append('category', formData.category)
      submitData.append('description', formData.description)
      submitData.append('date', formData.date)
      submitData.append('isManager', formData.isManager)
      
      if (formData.receiptFile) {
        submitData.append('receipt', formData.receiptFile)
      }
      
      const response = await fetch('/api/expenses/submit', {
        method: 'POST',
        body: submitData
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: "Expense Submitted Successfully!",
          description: `Your expense claim for ${formData.currency} ${formData.amount} has been submitted for approval.`,
        })
        
        // Reset form
        setFormData({
          amount: '',
          currency: session?.user?.company?.currency || 'USD',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          receiptFile: null,
          isManager: false
        })
        
        // Redirect to employee dashboard
        router.push('/employee/dashboard')
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit expense",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedCurrency = currencies.find(c => c.code === formData.currency)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Receipt className="h-5 w-5 mr-2" />
          Submit New Expense
        </CardTitle>
        <CardDescription>
          Fill out the details below to submit your expense claim for approval
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Amount and Currency Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            </div>
            
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => handleInputChange('currency', value)}
                disabled={loadingCurrencies}
              >
                <SelectTrigger>
                  {loadingCurrencies ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading currencies...</span>
                    </div>
                  ) : (
                    <SelectValue />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center justify-between w-full">
                        <span>{currency.symbol} {currency.code}</span>
                        <span className="text-xs text-gray-500 ml-2">{currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select expense category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the expense"
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date">Expense Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`pl-10 ${errors.date ? 'border-red-500' : ''}`}
                max={new Date().toISOString().split('T')[0]} // Can't select future dates
              />
            </div>
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
          </div>

          {/* Information about approval workflow */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Approval workflow:</strong> {formData.isManager 
                ? 'As a manager, this expense will go through the standard manager approval workflow including your manager and other approvers.' 
                : 'This expense will skip manager approval and go directly to other approvers (Finance, Director, etc.).'}
            </p>
          </div>

          {/* Receipt Upload */}
          <div>
            <Label>Receipt (Optional)</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {formData.receiptFile ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-green-500" />
                  <p className="text-sm font-medium">{formData.receiptFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(formData.receiptFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, receiptFile: null }))}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Receipt className="h-8 w-8 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Drop your receipt here or</p>
                    <input
                      type="file"
                      id="receipt-upload"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('receipt-upload').click()}
                    >
                      Browse Files
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Supports JPG, PNG, PDF up to 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Company Currency Note */}
          {formData.currency !== session?.user?.company?.currency && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This expense will be converted from {selectedCurrency?.name} ({selectedCurrency?.symbol}) 
                to your company's default currency ({session?.user?.company?.currency}) for reporting purposes.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Expense
              </>
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}