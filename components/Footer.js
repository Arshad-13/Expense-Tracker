'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Mail, 
  Phone,
  Receipt
} from 'lucide-react'

export default function Footer() {
  const { data: session } = useSession()

  const currentYear = new Date().getFullYear()

  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://facebook.com',
      icon: Facebook,
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com',
      icon: Twitter,
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com',
      icon: Linkedin,
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com',
      icon: Instagram,
    },
  ]

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Receipt className="h-8 w-8 text-accent" />
              <div className="text-2xl font-bold text-primary">
                ExpenseFlow
              </div>
            </Link>
            <p className="text-muted-foreground max-w-sm leading-relaxed text-sm">
              Simplifying expense management for modern businesses. Automate claims, customize workflows, 
              and gain full financial transparency with our intelligent platform.
            </p>
          </div>

          {/* Contact Info & Features link */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-3 uppercase tracking-wider text-xs">Navigation</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/#features" className="hover:text-accent transition-colors">
                    Features
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 uppercase tracking-wider text-xs">Contact Us</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-accent" />
                  <a href="mailto:hello@expenseflow.com" className="hover:text-accent transition-colors">
                    hello@expenseflow.com
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-accent" />
                  <span>1-800-EXPENSE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <span>© {currentYear} ExpenseFlow. All rights reserved.</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-6">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-accent transition-colors duration-200 transform hover:scale-110"
                    aria-label={social.name}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}