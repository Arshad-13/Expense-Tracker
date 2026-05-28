'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import { Building2, Mail, Lock, AlertCircle, Eye, EyeOff, UserPlus } from 'lucide-react'

const DEMO_CREDENTIALS = [
  { label: 'Admin', role: 'ADMIN', email: 'admin@demo.com' },
  { label: 'Director', role: 'DIRECTOR', email: 'director@demo.com' },
  { label: 'Finance', role: 'FINANCE', email: 'finance@demo.com' },
  { label: 'Manager', role: 'MANAGER', email: 'manager@demo.com' },
  { label: 'Employee', role: 'EMPLOYEE', email: 'employee@demo.com' },
  { label: 'Sales', role: 'EMPLOYEE', email: 'sales@demo.com' },
  { label: 'Ops', role: 'EMPLOYEE', email: 'ops@demo.com' },
  { label: 'Intern', role: 'EMPLOYEE', email: 'intern@demo.com' },
]

const DEMO_COMPANY_ID = 'DEMO-ACME'
const DEMO_PASSWORD = 'Demo@1234'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    companyId: DEMO_COMPANY_ID,
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status, update } = useSession()
  const { toast } = useToast()

  // Pre-fill company ID from URL params and redirect if authenticated
  useEffect(() => {
    const companyIdFromUrl = searchParams.get('companyId')
    if (companyIdFromUrl) {
      setFormData(prev => ({ ...prev, companyId: companyIdFromUrl }))
    }
    
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router, searchParams])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <Spinner className="h-8 w-8 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render login form if authenticated
  if (status === 'authenticated') {
    return null
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.companyId.trim()) {
      newErrors.companyId = 'Company ID is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
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

  const applyDemoCredentials = (email) => {
    setFormData({
      companyId: DEMO_COMPANY_ID,
      email,
      password: DEMO_PASSWORD,
    })
    setShowPassword(false)
    setError('')
    setErrors({})
  }

  const handleCredentialsLogin = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        companyId: formData.companyId,
        email: formData.email,
        password: formData.password,
        redirect: false
      })
      
      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Invalid credentials or company ID')
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Invalid credentials or company ID. Please check your details.",
          })
        } else {
          setError(result.error)
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
          })
        }
      } else if (result?.ok) {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        })
        
        // Get session to determine redirect based on role
        const session = await getSession()
        const userRole = session?.user?.role
        
        // Redirect based on role
        if (userRole === 'ADMIN') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-accent/10 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-accent rounded-full flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your company credentials to access the expense management system
          </CardDescription>
          <p className="text-xs text-muted-foreground mt-2">
            Demo company ID: <span className="font-medium">{DEMO_COMPANY_ID}</span>
          </p>
        </CardHeader>
        <form onSubmit={handleCredentialsLogin}>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-medium">Quick demo logins</p>
                  <p className="text-xs text-muted-foreground">
                    Click any role to auto-fill the form.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_CREDENTIALS.map((account) => (
                  <Button
                    key={account.email}
                    type="button"
                    variant="outline"
                    className="justify-start text-left h-auto py-2 px-3"
                    onClick={() => applyDemoCredentials(account.email)}
                    disabled={loading}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{account.label}</span>
                      <span className="text-[11px] text-muted-foreground">{account.email}</span>
                    </div>
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Password for all demo users: <span className="font-medium">{DEMO_PASSWORD}</span>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <Label htmlFor="companyId">Company ID *</Label>
              <Input
                id="companyId"
                type="text"
                value={formData.companyId}
                onChange={(e) => handleInputChange('companyId', e.target.value)}
                placeholder="Enter your company ID"
                className={errors.companyId ? 'border-red-500' : ''}
                autoComplete="organization"
                disabled={loading}
              />
              {errors.companyId && (
                <p className="text-red-500 text-sm mt-1">{errors.companyId}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Don't have a company ID? Contact your admin or create a new company.
              </p>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className={errors.email ? 'border-red-500' : ''}
                autoComplete="email"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className={errors.password ? 'border-red-500' : ''}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            
            <div className="text-center space-y-4">
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Don't have a company account yet?
                </p>
                <Link href="/onboard">
                  <Button variant="outline" className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create New Company
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 mt-2">
                  Set up your company's expense management system
                </p>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">
                  Individual employees cannot register directly.<br/>
                  Contact your company admin for account access.
                </p>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}