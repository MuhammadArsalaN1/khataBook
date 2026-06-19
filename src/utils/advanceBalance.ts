import { AdvanceBalanceEntry, AdvanceBalanceTransaction, UserAdvanceBalance, AdvanceBalanceSummary, Expense } from '../types';
import { getDisplayName } from './userResolution';

const counted = (s?: string) => s !== 'rejected' && s !== 'pending';

/**
 * Calculate total amount used from an advance entry through expenses
 */
export function calculateAdvanceUsed(
  advanceEntryId: string,
  expenses: Expense[]
): number {
  return expenses
    .filter(e => e.advanceEntryId === advanceEntryId && e.source === 'advance' && counted(e.status))
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate remaining balance for an advance entry
 */
export function calculateAdvanceRemaining(
  entry: AdvanceBalanceEntry,
  expenses: Expense[]
): number {
  const used = calculateAdvanceUsed(entry.id, expenses);
  return Math.max(0, entry.amount - used);
}

/**
 * Calculate the balance for a specific user email
 * Positive = they owe money, Negative = money owed to them
 */
export function calculateUserBalance(
  userEmail: string,
  entries: AdvanceBalanceEntry[],
  expenses: Expense[]
): number {
  let balance = 0;

  entries.forEach(entry => {
    const used = calculateAdvanceUsed(entry.id, expenses);
    const remaining = entry.amount - used;

    if (entry.direction === 'given') {
      // If I gave money to someone
      if (entry.receiverEmail === userEmail) {
        // They received from me, so they owe me
        balance += remaining;
      }
    } else {
      // If I received money from someone
      if (entry.giverEmail === userEmail) {
        // They gave to me, so I owe them
        balance += remaining;
      }
    }
  });

  return balance;
}

/**
 * Get user advance balance summary
 */
export function getUserAdvanceBalance(
  userEmail: string,
  entries: AdvanceBalanceEntry[],
  expenses: Expense[]
): UserAdvanceBalance {
  const userEntries = entries.filter(
    e => e.giverEmail === userEmail || e.receiverEmail === userEmail
  );

  const totalReceived = userEntries
    .filter(e => e.receiverEmail === userEmail)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalGiven = userEntries
    .filter(e => e.giverEmail === userEmail)
    .reduce((sum, e) => sum + e.amount, 0);

  const settledCount = userEntries.filter(e => e.status === 'settled').length;
  const activeCount = userEntries.filter(e => e.status === 'active').length;

  const lastTransaction = userEntries.length > 0 ? userEntries[0].createdAt : undefined;

  const balance = calculateUserBalance(userEmail, entries, expenses);

  return {
    email: userEmail,
    displayName: getDisplayName(userEmail),
    balance,
    totalReceived,
    totalGiven,
    settledCount,
    activeCount,
    lastTransaction,
  };
}

/**
 * Get transaction history for an advance entry
 */
export function getAdvanceTransactionHistory(
  advanceEntryId: string,
  expenses: Expense[]
): AdvanceBalanceTransaction[] {
  return expenses
    .filter(e => e.advanceEntryId === advanceEntryId && e.source === 'advance' && counted(e.status))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((e, idx) => ({
      id: `txn_${advanceEntryId}_${idx}`,
      advanceEntryId: advanceEntryId,
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
  userEmail: string,
  entries: AdvanceBalanceEntry[],
  expenses: Expense[]
): AdvanceBalanceSummary {
  const userAdvanceBalance = getUserAdvanceBalance(userEmail, entries, expenses);
  const userEntries = entries.filter(
    e => e.giverEmail === userEmail || e.receiverEmail === userEmail
  );

  // Get recent transactions
  const allTransactions: AdvanceBalanceTransaction[] = [];
  userEntries.forEach(entry => {
    allTransactions.push(...getAdvanceTransactionHistory(entry.id, expenses));
  });
  const recentTransactions = allTransactions
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 10);

  return {
    email: userEmail,
    displayName: userAdvanceBalance.displayName,
    balance: userAdvanceBalance.balance,
    totalReceived: userAdvanceBalance.totalReceived,
    totalGiven: userAdvanceBalance.totalGiven,
    activeAdvances: userAdvanceBalance.activeCount,
    recentTransactions,
  };
}

/**
 * Validate advance entry creation
 */
export function validateAdvanceEntry(
  giverName: string,
  receiverName: string,
  amount: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!giverName || giverName.trim().length === 0) {
    errors.push('Giver name is required');
  }

  if (!receiverName || receiverName.trim().length === 0) {
    errors.push('Receiver name is required');
  }

  if (giverName.trim().toLowerCase() === receiverName.trim().toLowerCase()) {
    errors.push('Giver and receiver cannot be the same person');
  }

  if (amount <= 0) {
    errors.push('Advance amount must be greater than 0');
  }

  if (amount > 10000000) {
    errors.push('Advance amount seems unusually high - verify correct value');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if advance entry can be settled
 */
export function canSettleEntry(
  entry: AdvanceBalanceEntry,
  expenses: Expense[]
): boolean {
  const remaining = calculateAdvanceRemaining(entry, expenses);
  return remaining === 0; // Can only settle when fully used
}

/**
 * Get all user emails that have advance balances
 */
export function getAdvanceUsers(
  entries: AdvanceBalanceEntry[]
): string[] {
  const users = new Set<string>();

  entries.forEach(entry => {
    if (entry.giverEmail && entry.giverEmail !== 'others') users.add(entry.giverEmail);
    if (entry.receiverEmail && entry.receiverEmail !== 'others') users.add(entry.receiverEmail);
  });

  return Array.from(users);
}

/**
 * Get total outstanding advances (what everyone owes combined)
 */
export function getTotalOutstanding(
  entries: AdvanceBalanceEntry[],
  expenses: Expense[]
): number {
  return entries
    .filter(e => e.status === 'active')
    .reduce((sum, e) => sum + calculateAdvanceRemaining(e, expenses), 0);
}

/**
 * Enrich advance entry with calculated values
 */
export interface AdvanceEntryWithCalculations extends AdvanceBalanceEntry {
  used: number;
  remaining: number;
  settlementPercentage: number;
}

export function enrichAdvanceEntry(
  entry: AdvanceBalanceEntry,
  expenses: Expense[]
): AdvanceEntryWithCalculations {
  const used = calculateAdvanceUsed(entry.id, expenses);
  const remaining = calculateAdvanceRemaining(entry, expenses);
  const settlementPercentage = entry.amount > 0
    ? Math.round((used / entry.amount) * 100)
    : 0;

  return {
    ...entry,
    used,
    remaining,
    settlementPercentage,
  };
}
