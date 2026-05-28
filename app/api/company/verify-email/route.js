import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import prisma from '@/lib/prisma'
import { generateCompanyId, sendCompanyIdEmail } from '@/lib/email'
import { deleteVerificationData, getVerificationData } from '@/lib/verification-store'

export async function POST(request) {
  try {
    const { email, code } = await request.json()

    // Validate input
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // Get stored verification data
    const storedData = await getVerificationData(email)

    if (!storedData) {
      return NextResponse.json(
        { error: 'Verification code not found or expired' },
        { status: 400 }
      )
    }

    // Check if code expired
    if (Date.now() > storedData.expiresAt) {
      await deleteVerificationData(email)
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      )
    }

    // Verify code
    if (storedData.code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Generate unique company ID
    let companyId = generateCompanyId()
    let existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    })

    // Regenerate if collision (very rare)
    while (existingCompany) {
      companyId = generateCompanyId()
      existingCompany = await prisma.company.findUnique({
        where: { id: companyId },
      })
    }

    // Hash password
    const hashedPassword = await hash(storedData.password, 12)

    // Create company and admin user in a transaction
    const company = await prisma.company.create({
      data: {
        id: companyId,
        name: storedData.companyName,
        country: 'US', // Default, can be updated later
        currency: 'USD', // Default, can be updated later
        users: {
          create: {
            name: storedData.companyName + ' Admin',
            email: email,
            password: hashedPassword,
            role: 'ADMIN',
          },
        },
      },
      include: {
        users: true,
      },
    })

    await prisma.companySetting.create({
      data: {
        companyId: company.id,
        approvalRequired: true,
        managerApprovalFirst: true,
        sequentialApproval: true,
      },
    })

    // Clear verification data
    await deleteVerificationData(email)

    // Send company ID email
    await sendCompanyIdEmail(email, storedData.companyName, companyId)

    return NextResponse.json({
      success: true,
      companyId: companyId,
      message: 'Company created successfully',
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    )
  }
}
