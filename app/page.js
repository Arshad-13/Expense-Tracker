import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { 
  Receipt, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Scan,
  GitBranch,
  Zap,
  Building2,
  TrendingUp,
  Users,
  Upload,
  CheckCheck,
  Banknote,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Briefcase,
  Award
} from 'lucide-react'

export default async function Home() {
  const session = await getServerSession(authOptions)
  const isAuthed = !!session?.user
  const ctaHref = isAuthed ? '/dashboard' : '/auth/register'
  const demoHref = isAuthed ? '/expense' : '/auth/login'
  const finalCtaHref = isAuthed ? '/dashboard' : '/auth/register'

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 lg:py-28 bg-gradient-to-br from-primary via-primary/95 to-primary/90 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse" style={{animationDuration: '4s'}} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '6s', animationDelay: '2s'}} />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-semibold italic text-white mb-6 leading-tight animate-fade-in">
              Stop Chasing Receipts.<br />
              <span className="text-accent drop-shadow-[0_0_30px_rgba(0,212,179,0.5)]">Start Reimbursing.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
              The all-in-one platform to <span className="font-semibold text-white">automate expense claims</span>, 
              customize approval flows, and gain full financial transparency.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href={ctaHref}>
                <Button size="lg" className="text-lg px-10 py-6 bg-accent hover:bg-accent/90 text-white shadow-2xl shadow-accent/50 hover:shadow-accent/70 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 relative group">
                  <span className="relative z-10">{isAuthed ? 'Go to Dashboard' : 'Get Started for Free'}</span>
                  <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent/80 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
                </Button>
              </Link>
              <Link href={demoHref}>
                <Button size="lg" variant="outline" className="text-lg px-10 py-6 bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm shadow-xl transition-all duration-300 transform hover:scale-105">
                  {isAuthed ? 'Start Expense' : 'Watch Demo'}
                  <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </Button>
              </Link>
            </div>

            {/* Hero Image/Animation - Enhanced Receipt Card */}
            <div className="mt-12 relative max-w-4xl mx-auto">
              {/* Floating background elements */}
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-4 -right-4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
              
              {/* Main card container */}
              <div className="relative bg-white/10 backdrop-blur-md rounded-3xl border border-white/30 p-4 sm:p-8 shadow-2xl hover:shadow-accent/20 transition-all duration-500 transform hover:scale-[1.02]">
                {/* Inner receipt card */}
                <div className="bg-gradient-to-br from-white via-white/95 to-gray-50 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full" />
                  
                  {/* Header with receipt icon and dots */}
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-xl">
                        <Receipt className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">EXPENSE RECEIPT</p>
                        <p className="text-sm text-gray-600 font-semibold">#EXP-2024-001</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-lg shadow-accent/50" />
                      <div className="w-3 h-3 rounded-full bg-accent/60 animate-pulse shadow-lg shadow-accent/30" style={{animationDelay: '0.2s'}} />
                      <div className="w-3 h-3 rounded-full bg-accent/40 animate-pulse shadow-lg shadow-accent/20" style={{animationDelay: '0.4s'}} />
                    </div>
                  </div>

                  {/* Receipt details with realistic data */}
                  <div className="space-y-4 mb-6">
                    {/* Vendor line */}
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium mb-1">Vendor</p>
                        <p className="text-sm font-semibold text-gray-800">Starbucks Coffee - Downtown</p>
                      </div>
                    </div>
                    
                    {/* Date line */}
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary/70 mt-1.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium mb-1">Date</p>
                        <p className="text-sm font-semibold text-gray-800">October 3, 2025 • 2:45 PM</p>
                      </div>
                    </div>
                    
                    {/* Category line */}
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary/50 mt-1.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium mb-1">Category</p>
                        <div className="inline-flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800">Meals & Entertainment</p>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">Business</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount section */}
                  <div className="flex items-center justify-between pt-6 border-t-2 border-dashed border-gray-300">
                    <span className="text-sm font-medium text-gray-600">Total Amount</span>
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-2 bg-gradient-to-r from-accent/30 to-accent/20 rounded-lg shadow-md">
                        <span className="text-primary font-bold text-xl">$24.50</span>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-semibold">
                      <CheckCircle className="h-4 w-4" />
                      Auto-Processed
                    </div>
                    <div className="text-xs text-gray-500 font-medium">✓ Ready for Approval</div>
                  </div>
                </div>
              </div>

              {/* Floating info badges */}
              <div className="absolute -left-4 top-1/4 hidden lg:block">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-accent/20 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                  <Scan className="h-6 w-6 text-accent mb-2" />
                  <p className="text-xs font-semibold text-primary">Smart OCR</p>
                </div>
              </div>
              
              <div className="absolute -right-4 top-1/3 hidden lg:block">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-accent/20 transform rotate-6 hover:rotate-0 transition-transform duration-300">
                  <Zap className="h-6 w-6 text-accent mb-2" />
                  <p className="text-xs font-semibold text-primary">Instant Approval</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section - Animated Conveyor Belt */}
      <section className="py-12 bg-secondary/30 border-y border-border overflow-hidden">
        <div className="w-full">
          <p className="text-center text-muted-foreground font-semibold text-sm tracking-wider mb-8">
            TRUSTED BY LEADING COMPANIES
          </p>
          
          {/* Infinite scroll container - Full width */}
          <div className="relative overflow-hidden w-full">
            {/* Gradient overlays for fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-secondary/30 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-secondary/30 to-transparent z-10 pointer-events-none" />
            
            {/* Scrolling wrapper - seamless infinite loop */}
            <div className="flex items-center animate-scroll-smooth">
              {/* Company Logo Cards - First Set */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Building2 className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">Company A</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <TrendingUp className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">TechCorp</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Users className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">Enterprise</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Building2 className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">GlobalCo</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <TrendingUp className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">FinanceHub</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Briefcase className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">BusinessPro</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Award className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">AwardCo</span>
              </div>

              {/* Company Logo Cards - Second Set (Duplicate for seamless loop) */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Building2 className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">Company A</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <TrendingUp className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">TechCorp</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Users className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">Enterprise</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Building2 className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">GlobalCo</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <TrendingUp className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">FinanceHub</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Briefcase className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">BusinessPro</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Award className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">AwardCo</span>
              </div>

              {/* Company Logo Cards - Third Set (Extra for buffer) */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Building2 className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">Company A</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <TrendingUp className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">TechCorp</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Users className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">Enterprise</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Building2 className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">GlobalCo</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <TrendingUp className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">FinanceHub</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Briefcase className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">BusinessPro</span>
              </div>
              
              <div className="flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 h-20 w-48 flex items-center justify-center group mx-4">
                <Award className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="ml-3 font-semibold text-foreground/80">AwardCo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section id="features" className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-3xl md:text-5xl font-bold text-foreground mb-4">
              Overcome the Chaos of Manual Expenses
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Problems */}
            <div className="space-y-6">
              <div className="group flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-2 border-destructive/20 hover:border-destructive/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 bg-destructive/10 p-3 rounded-lg group-hover:bg-destructive/20 transition-colors">
                  <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-playfair font-semibold text-lg mb-2 text-foreground group-hover:text-destructive transition-colors">Time-Consuming Paperwork</h3>
                  <p className="text-muted-foreground leading-relaxed">Manual data entry wastes hours that could be spent on productive work.</p>
                </div>
              </div>
              
              <div className="group flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-2 border-destructive/20 hover:border-destructive/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 bg-destructive/10 p-3 rounded-lg group-hover:bg-destructive/20 transition-colors">
                  <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-playfair font-semibold text-lg mb-2 text-foreground group-hover:text-destructive transition-colors">Error-Prone Manual Entry</h3>
                  <p className="text-muted-foreground leading-relaxed">Human errors in expense reports lead to incorrect reimbursements and accounting issues.</p>
                </div>
              </div>
              
              <div className="group flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-2 border-destructive/20 hover:border-destructive/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 bg-destructive/10 p-3 rounded-lg group-hover:bg-destructive/20 transition-colors">
                  <Clock className="h-6 w-6 text-destructive flex-shrink-0" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-playfair font-semibold text-lg mb-2 text-foreground group-hover:text-destructive transition-colors">Lack of Transparency</h3>
                  <p className="text-muted-foreground leading-relaxed">Employees can't track expense status, leading to frustration and delays.</p>
                </div>
              </div>
              
              <div className="group flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-2 border-destructive/20 hover:border-destructive/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 bg-destructive/10 p-3 rounded-lg group-hover:bg-destructive/20 transition-colors">
                  <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-playfair font-semibold text-lg mb-2 text-foreground group-hover:text-destructive transition-colors">Rigid Approval Processes</h3>
                  <p className="text-muted-foreground leading-relaxed">One-size-fits-all workflows don't match your organization's unique needs.</p>
                </div>
              </div>
            </div>

            {/* Right Column - Solution */}
            <div className="relative">
              {/* Decorative background blurs */}
              <div className="absolute -top-8 -right-8 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
              
              <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-2xl p-8 border-2 border-accent/30 shadow-2xl backdrop-blur-sm hover:shadow-accent/20 transition-all duration-500 group">
                <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-white/50 to-accent/10 rounded-xl relative overflow-hidden border border-accent/20">
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 animate-shimmer" />
                  
                  {/* Checkmark icon with glow */}
                  <div className="relative z-10 mb-6">
                    <div className="absolute inset-0 bg-accent/30 rounded-full blur-2xl animate-pulse" />
                    <CheckCircle className="relative h-24 w-24 text-accent drop-shadow-[0_0_15px_rgba(0,212,179,0.5)] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  
                  <p className="relative z-10 text-2xl font-playfair font-bold text-primary mb-2 text-center">Clean & Organized Dashboard</p>
                  <p className="relative z-10 text-muted-foreground text-center px-4">Full visibility and control at your fingertips</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Showcase */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Feature 1 - OCR */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 md:order-1 relative">
              {/* Decorative background blurs */}
              <div className="absolute -top-8 -left-8 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              
              <div className="relative bg-gradient-to-br from-accent/20 via-accent/10 to-primary/20 rounded-2xl p-8 h-96 flex flex-col items-center justify-center border-2 border-accent/30 shadow-2xl hover:shadow-accent/30 transition-all duration-500 group overflow-hidden backdrop-blur-sm">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-accent/10 animate-shimmer" />
                
                {/* Icon with glow effect */}
                <div className="relative z-10 mb-6">
                  <div className="absolute inset-0 bg-accent/40 rounded-full blur-3xl animate-pulse" />
                  <Scan className="relative h-32 w-32 text-accent drop-shadow-[0_0_20px_rgba(0,212,179,0.6)] group-hover:scale-110 transition-transform duration-300" />
                </div>
                
                <p className="relative z-10 text-2xl font-playfair font-bold text-primary mb-2 text-center">Smart Receipt Scanning</p>
                <p className="relative z-10 text-muted-foreground text-center px-4">Instant data extraction with AI-powered OCR</p>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Scan and Go with Smart OCR
              </h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Let your employees snap a photo of any receipt. Our OCR algorithm automatically 
                reads and populates all the necessary fields like amount, date, and vendor, 
                creating an expense report in seconds.
              </p>
              <div className="flex gap-3 flex-wrap">
                <span className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium">Instant Recognition</span>
                <span className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium">99% Accuracy</span>
                <span className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium">Mobile Ready</span>
              </div>
            </div>
          </div>

          {/* Feature 2 - Approval Workflows */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Build the Approval Flow That Fits Your Business
              </h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Define simple or complex multi-level approval sequences. Route expenses from a 
                manager to finance to a director seamlessly. The expense automatically moves to 
                the next approver only after the current one takes action.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span className="text-foreground">Multi-level approval chains</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span className="text-foreground">Conditional routing based on amount</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span className="text-foreground">Real-time notifications</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              {/* Decorative background blurs */}
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
              
              <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 rounded-2xl p-8 h-96 flex flex-col items-center justify-center border-2 border-primary/30 shadow-2xl hover:shadow-primary/30 transition-all duration-500 group overflow-hidden backdrop-blur-sm">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-shimmer" />
                
                {/* Icon with glow effect */}
                <div className="relative z-10 mb-6">
                  <div className="absolute inset-0 bg-primary/40 rounded-full blur-3xl animate-pulse" style={{animationDuration: '3s'}} />
                  <GitBranch className="relative h-32 w-32 text-primary drop-shadow-[0_0_20px_rgba(10,37,64,0.6)] group-hover:scale-110 transition-transform duration-300" />
                </div>
                
                <p className="relative z-10 text-2xl font-playfair font-bold text-primary mb-2 text-center">Flexible Approval Workflows</p>
                <p className="relative z-10 text-muted-foreground text-center px-4">Custom routing that adapts to your business</p>
              </div>
            </div>
          </div>

          {/* Feature 3 - Conditional Rules */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative">
              {/* Decorative background blurs */}
              <div className="absolute -top-8 -left-8 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              
              <div className="relative bg-gradient-to-br from-accent/20 via-accent/10 to-primary/20 rounded-2xl p-8 h-96 flex flex-col items-center justify-center border-2 border-accent/30 shadow-2xl hover:shadow-accent/30 transition-all duration-500 group overflow-hidden backdrop-blur-sm">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-accent/10 animate-shimmer" />
                
                {/* Icon with glow effect */}
                <div className="relative z-10 mb-6">
                  <div className="absolute inset-0 bg-accent/40 rounded-full blur-3xl animate-pulse" style={{animationDuration: '2s'}} />
                  <Zap className="relative h-32 w-32 text-accent drop-shadow-[0_0_20px_rgba(0,212,179,0.6)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                </div>
                
                <p className="relative z-10 text-2xl font-playfair font-bold text-primary mb-2 text-center">Intelligent Automation</p>
                <p className="relative z-10 text-muted-foreground text-center px-4">Set it once and let the system work for you</p>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Set Your Approvals on Autopilot
              </h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Create smart rules to accelerate approvals. Set percentage-based approvals, 
                auto-approve if a specific person (like the CFO) signs off, or create hybrid 
                rules to match your company's policy.
              </p>
              <div className="bg-white/50 dark:bg-primary/5 rounded-xl p-6 border border-border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-approve under $50</span>
                    <div className="w-12 h-6 bg-accent rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Require 2 approvers over $1000</span>
                    <div className="w-12 h-6 bg-accent rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CFO approval = instant approval</span>
                    <div className="w-12 h-6 bg-accent rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
              Get Reimbursed in 3 Simple Steps
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-accent to-accent/70 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
                  <Upload className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Submit Expense</h3>
              <p className="text-muted-foreground">
                Employee submits a claim by snapping a receipt or filling a quick form.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
                  <GitBranch className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Automatic Routing</h3>
              <p className="text-muted-foreground">
                The expense is sent through your custom-defined approval workflow.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-accent to-accent/70 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
                  <Banknote className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Approve & Reimburse</h3>
              <p className="text-muted-foreground">
                Approvers are notified, can approve with one click, and the employee is informed instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary via-primary/95 to-primary/90 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Simplify Your Expense Management?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join hundreds of companies already saving time and money with ExpenseFlow.
            </p>
            
            <Link href={finalCtaHref}>
              <Button size="lg" className="text-lg px-12 py-6 bg-accent hover:bg-accent/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                {isAuthed ? 'Open Dashboard' : 'Sign Up and Start Your Free Trial'}
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}