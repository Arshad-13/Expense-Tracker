'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  ReceiptText,
  ClipboardList,
  Users,
  Settings,
  ShieldCheck,
  FileSpreadsheet,
  Clock3,
  LogOut,
  Menu,
  X,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const roleLinks = {
  ADMIN: [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Company Setup', href: '/onboard', icon: ShieldCheck },
    { title: 'Approvals', href: '/approval', icon: ClipboardList },
  ],
  MANAGER: [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Submit Expense', href: '/expense', icon: ReceiptText },
    { title: 'Approvals', href: '/approval', icon: ClipboardList },
  ],
  FINANCE: [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Review Queue', href: '/approval', icon: ClipboardList },
  ],
  DIRECTOR: [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'High Value Claims', href: '/approval', icon: ClipboardList },
  ],
  EMPLOYEE: [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Submit Expense', href: '/expense', icon: ReceiptText },
    { title: 'My Drafts', href: '/expense/draft', icon: Clock3 },
  ],
}

export default function Sidebar({ isOpen, setIsOpen }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const links = session?.user?.role ? roleLinks[session.user.role] || roleLinks.EMPLOYEE : []

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/', redirect: true })
    } catch (error) {
      window.location.href = '/'
    }
  }

  const NavContent = () => (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-playfair font-bold text-primary">
            ExpenseFlow
          </span>
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
          Menu
        </div>
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
          return (
            <Link key={link.title} href={link.href} onClick={() => setIsOpen(false)}>
              <span
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.title}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t">
        <div className="mb-4 px-2">
          <div className="text-sm font-medium text-foreground truncate">
            {session?.user?.name || 'User'}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {session?.user?.email}
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  )
}
