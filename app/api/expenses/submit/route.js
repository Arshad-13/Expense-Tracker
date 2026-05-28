import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { approvalWorkflowService } from '@/lib/approval-workflow'

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''

    let payload = {}
    let receiptId = null
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      payload = {
        amount: form.get('amount'),
        currency: form.get('currency'),
        category: form.get('category'),
        description: form.get('description') || '',
        date: form.get('date'),
      }

      const receiptFile = form.get('receipt')
      if (receiptFile && receiptFile.name && receiptFile.size > 0) {
        try {
          const bytes = await receiptFile.arrayBuffer()
          const buffer = Buffer.from(bytes)

          const fs = require('fs')
          const path = require('path')
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts')
          
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
          }

          const uniqueFilename = `${Date.now()}-${receiptFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
          const filePath = path.join(uploadDir, uniqueFilename)
          fs.writeFileSync(filePath, buffer)
          receiptId = `/uploads/receipts/${uniqueFilename}`
        } catch (uploadError) {
          console.error('Failed to save receipt file:', uploadError)
        }
      }
    } else {
      payload = await req.json()
    }

    const amount = parseFloat(payload.amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const currency = String(payload.currency || '').trim()
    const category = String(payload.category || '').trim()
    const description = String(payload.description || '').trim()
    const dateInput = payload.date ? new Date(payload.date) : new Date()
    const isManager = session.user.role === 'MANAGER'

    if (!currency) return NextResponse.json({ error: 'Currency is required' }, { status: 400 })
    if (!category) return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    if (Number.isNaN(dateInput.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })

    // Optional line items payload from manual form
    let items = payload.items || payload.lineItems || null
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items)
      } catch {
        items = null
      }
    }

    const expense = await approvalWorkflowService.submitExpense(
      {
        amount,
        amountInCompany: amount,
        currency,
        category,
        description: description || null,
        date: dateInput,
        isManager,
        items: items || undefined,
        receiptId: receiptId || undefined,
      },
      session.user.id,
    )

    return NextResponse.json({ id: expense.id, status: expense.status }, { status: 201 })
  } catch (err) {
    console.error('Expense submit error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}