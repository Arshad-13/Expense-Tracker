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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Building2, Mail, Lock, AlertCircle, Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react'

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
  const { data: session, status } = useSession()
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
    toast({
      title: "Credentials Loaded",
      description: `Filled fields with demo credentials.`,
    })
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
        
        router.push('/dashboard')
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
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Panel: Hero and Quick demo credentials (visible on desktop) */}
      <div className="hidden md:flex md:w-5/12 lg:w-4/12 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground p-8 flex-col justify-between relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <span className="text-2xl font-playfair font-bold text-white tracking-wide">
              ExpenseFlow
            </span>
          </Link>

          <h2 className="text-3xl lg:text-4xl font-playfair font-semibold italic text-white mb-6 leading-tight">
            Seamless Expense Tracking for Teams
          </h2>
          <p className="text-white/80 font-light leading-relaxed mb-8">
            Automate claims processing, customize sequential approval workflows, and gain clear financial insights in real-time.
          </p>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 mt-6">
            <h3 className="text-sm font-semibold text-accent mb-2 uppercase tracking-wider">Quick Demo Roles</h3>
            <p className="text-xs text-white/70 mb-4">Click any profile below to auto-fill credentials for testing:</p>
            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
              {DEMO_CREDENTIALS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => applyDemoCredentials(account.email)}
                  disabled={loading}
                  className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent/40 rounded-xl text-left transition-all duration-200 group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">{account.label}</span>
                    <span className="text-xs text-white/50">{account.email}</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 bg-accent/20 text-accent rounded-full font-medium">
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
            <div className="text-[11px] text-white/40 mt-4 text-center">
              Universal Demo Password: <span className="font-semibold text-accent">{DEMO_PASSWORD}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/50 border-t border-white/10 pt-4">
          © {new Date().getFullYear()} ExpenseFlow. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-secondary/10">
        <Card className="w-full max-w-md bg-white dark:bg-card border border-border/80 shadow-2xl p-6 sm:p-8 rounded-2xl relative overflow-hidden">
          {/* Logo for mobile view only */}
          <div className="flex md:hidden justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-accent/15 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-accent" />
              </div>
              <span className="text-xl font-playfair font-bold text-primary">
                ExpenseFlow
              </span>
            </Link>
          </div>

          <div className="mb-6 text-center md:text-left">
            <h1 className="text-2xl font-bold text-foreground">Sign In</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Enter your credentials to access the expense management system.
            </p>
          </div>

          <form onSubmit={handleCredentialsLogin} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-2 text-destructive bg-destructive/10 border border-destructive/20 p-3.5 rounded-xl">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyId" className="text-foreground/80 font-medium">Company ID *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyId"
                    type="text"
                    value={formData.companyId}
                    onChange={(e) => handleInputChange('companyId', e.target.value)}
                    placeholder="Enter your company ID"
                    className={`pl-10 bg-white dark:bg-background ${errors.companyId ? 'border-destructive' : ''}`}
                    autoComplete="organization"
                    disabled={loading}
                    required
                  />
                </div>
                {errors.companyId && (
                  <p className="text-destructive text-xs mt-1">{errors.companyId}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-foreground/80 font-medium">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="name@company.com"
                    className={`pl-10 bg-white dark:bg-background ${errors.email ? 'border-destructive' : ''}`}
                    autoComplete="email"
                    disabled={loading}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-foreground/80 font-medium">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 bg-white dark:bg-background ${errors.password ? 'border-destructive' : ''}`}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">{errors.password}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-6 rounded-xl transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Mobile-only collapsible Quick Demo Roles */}
            <div className="md:hidden border-t pt-4">
              <details className="group">
                <summary className="list-none flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none">
                  <span>Show Demo Logins</span>
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {DEMO_CREDENTIALS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => applyDemoCredentials(account.email)}
                      disabled={loading}
                      className="flex items-center justify-between p-2.5 bg-muted/40 hover:bg-muted/80 border rounded-xl text-left transition-all text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{account.label}</span>
                        <span className="text-[10px] text-muted-foreground">{account.email}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] scale-90 whitespace-nowrap">
                        {account.role}
                      </Badge>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-3 bg-muted/30 p-2 rounded-lg">
                  Universal Demo Password: <span className="font-semibold text-foreground">{DEMO_PASSWORD}</span>
                </p>
              </details>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-border/80 pt-4 text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                Don't have a company account yet?
              </p>
              <Link href="/onboard" className="block">
                <Button variant="outline" className="w-full py-5 rounded-xl bg-white dark:bg-background border-accent/20 text-accent hover:bg-accent/5">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create New Company
                </Button>
              </Link>
              <p className="text-[10px] text-muted-foreground">
                Individual employees cannot register directly. <br />
                Contact your company administrator for access.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}