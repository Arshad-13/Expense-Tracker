'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { approvalWorkflowService } from '@/lib/approval-workflow';

/**
 * Server action to save expense data to draft (initiates sequential approval workflow)
 * @param {Object} expenseData - The expense data to save
 * @returns {Promise<Object>} - Result with success/error status
 */
export async function saveToDraft(expenseData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || !session.user?.companyId) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.'
      };
    }

    console.log('Saving expense via server action:', expenseData);

    const { date, total, currency, category, lineItems, description } = expenseData;
    
    if (!date || !total || !currency) {
      return {
        success: false,
        message: 'Missing required fields: date, amount, or currency'
      };
    }

    const totalAmount = parseFloat(total);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return {
        success: false,
        message: 'Invalid amount'
      };
    }

    const isManager = session.user.role === 'MANAGER';

    // Submit expense using the approval workflow engine
    const expense = await approvalWorkflowService.submitExpense(
      {
        amount: totalAmount,
        currency: currency.trim(),
        category: category || 'General',
        description: description || null,
        date: new Date(date),
        isManager,
        items: lineItems || undefined,
      },
      session.user.id
    );

    console.log('Expense saved and workflow initialized:', expense.id);

    return {
      success: true,
      message: 'Expense submitted successfully!',
      expense
    };

  } catch (error) {
    console.error('Error saving expense:', error);
    return {
      success: false,
      message: 'Failed to submit expense. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}
