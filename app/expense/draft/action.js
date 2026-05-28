"use server";

import prisma from '@/lib/prisma';

export async function processDraftExpenses(expenses, { companyId, submittedById } = {}) {
  try {
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return {
        success: false,
        message: 'No expenses provided'
      };
    }
    if (!companyId || !submittedById) {
      return {
        success: false,
        message: 'Missing companyId or submittedById for creating expenses'
      };
    }

    // Map incoming draft shape to Prisma Expense fields
    const data = expenses.map(expense => ({
      companyId,
      submittedById,
      amount: parseFloat(expense.total_amount) || 0,
      currency: expense.currency || 'USD',
      category: expense.category || 'General',
      description: expense.description || null,
      date: expense.transaction_date ? new Date(expense.transaction_date) : new Date(),
      status: 'PENDING',
      items: expense.line_items && expense.line_items.length ? expense.line_items : undefined,
    }));

    const createdExpenses = await prisma.expense.createMany({ data });

    return {
      success: true,
      message: `Successfully processed ${expenses.length} draft expenses`,
      expenses: createdExpenses
    };

  } catch (error) {
    console.error('Error processing draft expenses:', error);
    return {
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}
