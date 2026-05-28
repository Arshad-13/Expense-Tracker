'use client'

import React from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ProfileDialog from '@/components/ProfileDialog'
import { Menu, X, LogOut } from 'lucide-react'

export default function Navbar() {
  const { data: session, status, update } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  

  const handleSignOut = async () => {
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      })
    } catch (error) {
      // Fallback redirect
      window.location.href = '/'
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-playfair font-bold text-primary">
              ExpenseFlow
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="font-playfair text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Features
            </Link>
            
            {status === 'loading' ? (
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="font-playfair text-foreground hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                
                {/* User Profile Dialog */}
                <ProfileDialog />
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-foreground/80">
                    Log In
                  </Button>
                </Link>
                <Link href="/onboard">
                  <Button className="bg-accent hover:bg-accent/90 text-white">
                    Sign Up Free
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t">
              <Link
                href="#features"
                className="font-playfair block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              
              {status === 'loading' ? (
                <div className="px-3 py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  
                  <div className="px-3 py-2 border-t border-gray-200">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage 
                          src={session.user?.image || ''} 
                          alt={session.user?.name || 'User'} 
                        />
                        <AvatarFallback>
                          {session.user?.name?.[0]?.toUpperCase() || 
                           session.user?.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-base font-medium text-foreground">
                          {session.user?.name || 'User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.user?.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 py-2 text-base font-medium"
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </>
              ) : (
                <div className="px-3 py-2 space-y-2">
                  <Link
                    href="/auth/login"
                    className="block w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start">
                      Login
                    </Button>
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}