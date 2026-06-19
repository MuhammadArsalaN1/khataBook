import { AdvanceBalance, AdvanceTransaction, AdvanceBalanceSummary, Expense } from '../types';

const counted = (s?: string) => s !== 'rejected' && s !== 'pending';

/**
 * Calculate total amount used from an advance balance through expenses
 */
export function calculateAdvanceUsed(
  advanceId: string,
  expenses: Expense[]
): number {
  return expenses
    .filter(e => e.advanceBalanceId === advanceId && e.source === 'advance' && counted(e.status))
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate remaining balance for an advance
 */
export function calculateAdvanceRemaining(
  advance: AdvanceBalance,
  expenses: Expense[]
): number {
  const used = calculateAdvanceUsed(advance.id, expenses);
  return Math.max(0, advance.originalAmount - used);
}

/**
 * Enrich advance balance with calculated values
 */
export interface AdvanceBalanceWithCalculations extends AdvanceBalance {
  calculatedUsed: number;
  calculatedRemaining: number;
  settlementPercentage: number;
}

export function enrichAdvanceBalance(
  advance: AdvanceBalance,
  expenses: Expense[]
): AdvanceBalanceWithCalculations {
  const calculatedUsed = calculateAdvanceUsed(advance.id, expenses);
  const calculatedRemaining = calculateAdvanceRemaining(advance, expenses);
  const settlementPercentage = advance.originalAmount > 0
    ? Math.round((calculatedUsed / advance.originalAmount) * 100)
    : 0;

  return {
    ...advance,
    calculatedUsed,
    calculatedRemaining,
    settlementPercentage,
  };
}

/**
 * Get all advance balances for a specific user
 */
export function getUserAdvanceBalances(
  userId: string,
  advances: AdvanceBalance[]
): AdvanceBalance[] {
  return advances.filter(a => a.userId === userId && a.status === 'active');
}

/**
 * Get advance transaction history
 */
export function getAdvanceTransactionHistory(
  advanceId: string,
  expenses: Expense[]
): AdvanceTransaction[] {
  return expenses
    .filter(e => e.advanceBalanceId === advanceId && e.source === 'advance' && counted(e.status))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((e, idx) => ({
      id: `txn_${advanceId}_${idx}`,
      advanceBalanceId: advanceId,
      expenseId: e.id,
      amount: e.amount,
      category: e.category,
      description: e.notes || `${e.type} - ${e.category}`,
      transactionDate: e.date,
      createdAt: e.createdAt,
    }));
}

/**
 * Generate advance balance summary for a user
 */
export function generateAdvanceBalanceSummary(
  userId: string,
  userName: string,
  advances: AdvanceBalance[],
  expenses: Expense[]
): AdvanceBalanceSummary {
  const userAdvances = advances.filter(a => a.userId === userId);

  const totalAdvancesGiven = userAdvances.reduce((sum, a) => sum + a.originalAmount, 0);
  const totalAdvancesUsed = userAdvances.reduce((sum, a) => {
    return sum + calculateAdvanceUsed(a.id, expenses);
  }, 0);
  const totalRemaining = userAdvances.reduce((sum, a) => {
    return sum + calculateAdvanceRemaining(a, expenses);
  }, 0);

  const activeAdvances = userAdvances.filter(a => a.status === 'active').length;
  const settlementPercentage = totalAdvancesGiven > 0
    ? Math.round((totalAdvancesUsed / totalAdvancesGiven) * 100)
    : 0;

  // Get recent transactions
  const allTransactions: AdvanceTransaction[] = [];
  userAdvances.forEach(advance => {
    allTransactions.push(...getAdvanceTransactionHistory(advance.id, expenses));
  });
  const recentTransactions = allTransactions
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 10);

  return {
    userId,
    userName,
    totalAdvancesGiven,
    totalAdvancesUsed,
    totalRemaining,
    activeAdvances,
    settlementPercentage,
    recentTransactions,
  };
}

/**
 * Validate advance balance creation
 */
export function validateAdvanceBalance(
  userId: string,
  originalAmount: number,
  notes?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!userId || userId.trim().length === 0) {
    errors.push('User ID is required');
  }

  if (originalAmount <= 0) {
    errors.push('Advance amount must be greater than 0');
  }

  if (originalAmount > 10000000) {
    errors.push('Advance amount seems unusually high - verify correct value');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if advance balance can be settled
 */
export function canSettleAdvance(
  advance: AdvanceBalance,
  expenses: Expense[]
): boolean {
  const remaining = calculateAdvanceRemaining(advance, expenses);
  return remaining === 0; // Can only settle when fully used/returned
}

/**
 * Get settlement details
 */
export function getSettlementDetails(
  advance: AdvanceBalance,
  expenses: Expense[]
): {
  isFullyUsed: boolean;
  usedAmount: number;
  remainingAmount: number;
  canSettle: boolean;
  settlementDate?: string;
} {
  const usedAmount = calculateAdvanceUsed(advance.id, expenses);
  const remainingAmount = calculateAdvanceRemaining(advance, expenses);
  const isFullyUsed = remainingAmount === 0;
  const canSettle = isFullyUsed;

  return {
    isFullyUsed,
    usedAmount,
    remainingAmount,
    canSettle,
    settlementDate: canSettle ? new Date().toISOString() : undefined,
  };
}

/**
 * Get advance balance statistics
 */
export function getAdvanceStatistics(
  advances: AdvanceBalance[],
  expenses: Expense[]
): {
  totalAdvancesIssued: number;
  totalUsed: number;
  totalRemaining: number;
  averageSettlement: number;
  activesCount: number;
  settledCount: number;
} {
  const totalAdvancesIssued = advances.reduce((sum, a) => sum + a.originalAmount, 0);
  const totalUsed = advances.reduce((sum, a) => sum + calculateAdvanceUsed(a.id, expenses), 0);
  const totalRemaining = advances.reduce((sum, a) => sum + calculateAdvanceRemaining(a, expenses), 0);

  const completedAdvances = advances.filter(a => a.status === 'settled');
  const averageSettlement = completedAdvances.length > 0
    ? completedAdvances.reduce((sum, a) => sum + a.originalAmount, 0) / completedAdvances.length
    : 0;

  const activesCount = advances.filter(a => a.status === 'active').length;
  const settledCount = completedAdvances.length;

  return {
    totalAdvancesIssued,
    totalUsed,
    totalRemaining,
    averageSettlement: Math.round(averageSettlement),
    activesCount,
    settledCount,
  };
}
