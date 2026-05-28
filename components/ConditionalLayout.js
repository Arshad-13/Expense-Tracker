'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  
  // Pages that should not have navbar and footer
  const excludeNavFooterPages = ['/auth/login', '/onboard', '/dashboard', '/admin', '/approval', '/employee', '/expense']
  
  // Check if current path should exclude nav/footer
  const shouldExcludeNavFooter = excludeNavFooterPages.some(page => 
    pathname.startsWith(page)
  )
  
  if (shouldExcludeNavFooter) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="pt-16 flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}