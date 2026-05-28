'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Building2, User, MapPin, CreditCard, CheckCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCurrencies } from '@/hooks/use-currencies'

const STEPS = [
  { id: 1, name: 'Company Details', icon: Building2, description: 'Basic company information' },
  { id: 2, name: 'Admin Account', icon: User, description: 'Create your admin account' },
  { id: 3, name: 'Location & Currency', icon: MapPin, description: 'Set your business location' },
  { id: 4, name: 'Confirmation', icon: CheckCircle, description: 'Review and complete setup' }
]

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { currencies: availableCurrencies, countries, loading: loadingCountries } = useCurrencies()

  const [formData, setFormData] = useState({
    // Company Details
    companyName: '',
    companyDescription: '',
    industry: '',
    
    // Admin Account
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    
    // Location & Currency
    country: '',
    currency: '',
    currencySymbol: '',
    timezone: '',
    
    // Generated
    companyId: ''
  })

  const [errors, setErrors] = useState({})

  const validateStep = (step) => {
    const newErrors = {}
    
    switch (step) {
      case 1:
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'
        if (!formData.industry.trim()) newErrors.industry = 'Industry is required'
        break
      
      case 2:
        if (!formData.adminName.trim()) newErrors.adminName = 'Admin name is required'
        if (!formData.adminEmail.trim()) newErrors.adminEmail = 'Email is required'
        if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) newErrors.adminEmail = 'Email is invalid'
        if (!formData.adminPassword) newErrors.adminPassword = 'Password is required'
        if (formData.adminPassword.length < 8) newErrors.adminPassword = 'Password must be at least 8 characters'
        if (formData.adminPassword !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
        break
      
      case 3:
        if (!formData.country) newErrors.country = 'Country is required'
        if (!formData.currency) newErrors.currency = 'Currency is required'
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleCountryChange = (countryCode) => {
    const selectedCountry = countries.find(c => c.code === countryCode)
    if (selectedCountry) {
      setFormData(prev => ({
        ...prev,
        country: countryCode,
        currency: selectedCountry.currency,
        currencySymbol: selectedCountry.currencySymbol
      }))
    }
  }

  const handleCurrencyChange = (currencyCode) => {
    const selectedCurrency = availableCurrencies.find(c => c.code === currencyCode)
    if (selectedCurrency) {
      setFormData(prev => ({
        ...prev,
        currency: currencyCode,
        currencySymbol: selectedCurrency.symbol
      }))
    }
  }

  const generateCompanyId = () => {
    const companyName = formData.companyName.toLowerCase().replace(/\s+/g, '')
    const randomSuffix = Math.random().toString(36).substring(2, 6)
    return `${companyName}_${randomSuffix}`.substring(0, 20)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep - 1)) return
    
    setLoading(true)
    
    try {
      const companyId = generateCompanyId()
      const finalData = { ...formData, companyId }
      
      const response = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Automatically sign in the user
        const signInResult = await signIn('credentials', {
          email: formData.adminEmail,
          password: formData.adminPassword,
          redirect: false,
        })
        
        if (signInResult?.ok) {
          toast({
            title: "Company Created Successfully!",
            description: `Welcome to your admin dashboard!`,
            duration: 5000,
          })
          
          // Redirect directly to unified dashboard
          router.push('/dashboard')
        } else {
          toast({
            title: "Company Created",
            description: "Please sign in to access your dashboard.",
          })
          router.push('/auth/login')
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create company",
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

  const progress = (currentStep / STEPS.length) * 100

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Enter your company name"
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
            </div>
            
            <div>
              <Label htmlFor="companyDescription">Company Description</Label>
              <Input
                id="companyDescription"
                value={formData.companyDescription}
                onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                placeholder="Brief description of your company"
              />
            </div>
            
            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminName">Admin Full Name *</Label>
              <Input
                id="adminName"
                value={formData.adminName}
                onChange={(e) => handleInputChange('adminName', e.target.value)}
                placeholder="Enter your full name"
                className={errors.adminName ? 'border-red-500' : ''}
              />
              {errors.adminName && <p className="text-red-500 text-sm mt-1">{errors.adminName}</p>}
            </div>
            
            <div>
              <Label htmlFor="adminEmail">Admin Email *</Label>
              <Input
                id="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                placeholder="Enter your email address"
                className={errors.adminEmail ? 'border-red-500' : ''}
              />
              {errors.adminEmail && <p className="text-red-500 text-sm mt-1">{errors.adminEmail}</p>}
            </div>
            
            <div>
              <Label htmlFor="adminPassword">Password *</Label>
              <div className="relative">
                <Input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.adminPassword}
                  onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                  placeholder="Create a strong password"
                  className={errors.adminPassword ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.adminPassword && <p className="text-red-500 text-sm mt-1">{errors.adminPassword}</p>}
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
        )
      
      case 3:
        if (loadingCountries) {
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading countries and currencies...</span>
              </div>
            </div>
          )
        }
        
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="country">Country/Region *</Label>
              <Select value={formData.country} onValueChange={handleCountryChange}>
                <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center space-x-2">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
            </div>
            
            <div>
              <Label htmlFor="currency">Company Currency *</Label>
              <Select value={formData.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className={errors.currency ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select your company's default currency" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center justify-between w-full">
                        <span>{currency.code} - {currency.name}</span>
                        <Badge variant="secondary">{currency.symbol}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency}</p>}
              <p className="text-sm text-gray-500 mt-1">
                You can choose a different currency than your country's default currency
              </p>
            </div>
            
            {formData.currency && (
              <div>
                <Label>Selected Currency</Label>
                <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{formData.currency}</span>
                  <Badge variant="secondary">{formData.currencySymbol}</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  All expense reports will be converted to {formData.currency} for company overview
                </p>
              </div>
            )}
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Ready to Create Your Company!</h3>
              <p className="text-gray-500">Please review your details below</p>
            </div>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">Company Name:</span>
                <span>{formData.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Industry:</span>
                <span>{formData.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Admin Name:</span>
                <span>{formData.adminName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Admin Email:</span>
                <span>{formData.adminEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Country:</span>
                <span>{countries.find(c => c.code === formData.country)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Currency:</span>
                <span>{formData.currency} ({formData.currencySymbol})</span>
              </div>
            </div>
            
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="text-sm text-accent">
                <strong>Important:</strong> After creation, you'll receive a unique Company ID. 
                Save this ID as all users will need it to log in to your company's expense system.
              </p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-accent/10 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Company Onboarding</CardTitle>
          <CardDescription>Set up your expense management system in a few easy steps</CardDescription>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between mt-2">
              {STEPS.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= step.id
                        ? 'bg-accent text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-xs mt-1 text-center">{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">{STEPS[currentStep - 1]?.name}</h3>
            <p className="text-gray-500 text-sm">{STEPS[currentStep - 1]?.description}</p>
          </div>
          
          {renderStepContent()}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          
            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} className="flex items-center">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="flex items-center">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Company
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Navigation to Login */}
          <div className="text-center border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">
              Already have a company account?
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="flex items-center mx-auto">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Existing Company
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}