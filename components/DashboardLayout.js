'use client'

import React, { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProfileDialog from '@/components/ProfileDialog'

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-secondary/20 flex">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-background border-b h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Optional: Breadcrumbs or page title could go here */}
          </div>

          <div className="flex items-center gap-4">
            <ProfileDialog />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
