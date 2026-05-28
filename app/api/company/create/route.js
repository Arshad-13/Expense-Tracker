import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import prisma from '@/lib/prisma'
import {
  generateCompanyId,
  generateVerificationCode,
  sendCompanyVerificationEmail,
} from '@/lib/email'
import { setVerificationData } from '@/lib/verification-store'

export async function POST(request) {
  try {
    const { companyName, email, password } = await request.json()

    // Validate input
    if (!companyName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Generate verification code
    const verificationCode = generateVerificationCode()
    
    // Store verification data temporarily (expires in 10 minutes)
    await setVerificationData(email, {
      code: verificationCode,
      companyName,
      password,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    })

    // Send verification email
    await sendCompanyVerificationEmail(email, companyName, verificationCode)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    })
  } catch (error) {
    console.error('Company creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create company. Please try again.' },
      { status: 500 }
    )
  }
}
