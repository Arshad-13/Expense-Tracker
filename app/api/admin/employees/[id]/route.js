import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Delete the employee
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
    })
  } catch (error) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { name, email, role, managerId } = await request.json()

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      )
    }

    // Update user fields
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, role }
    })

    // Update manager relation
    if (managerId) {
      // Upsert relation
      const existingRelation = await prisma.employeeManager.findFirst({
        where: { employeeId: id }
      })

      if (existingRelation) {
        await prisma.employeeManager.update({
          where: { id: existingRelation.id },
          data: { managerId }
        })
      } else {
        await prisma.employeeManager.create({
          data: { employeeId: id, managerId }
        })
      }
    } else {
      // Delete manager relation if it exists
      await prisma.employeeManager.deleteMany({
        where: { employeeId: id }
      })
    }

    return NextResponse.json({
      success: true,
      employee: updatedUser,
      message: 'Employee updated successfully'
    })
  } catch (error) {
    console.error('Update employee error:', error)
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}
