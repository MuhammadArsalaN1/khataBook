import { AdvanceBalanceEntry, AdvanceReturn } from '../types';

/**
 * Record a return amount for an advance
 * Standard SOP: Update entry with return history
 */
export function recordAdvanceReturn(
  entry: AdvanceBalanceEntry,
  amount: number,
  method: string,
  recordedBy: string,
  notes?: string
): AdvanceBalanceEntry {
  if (amount <= 0) {
    throw new Error('Return amount must be greater than 0');
  }

  const totalReturned = entry.returnedAmount + amount;
  if (totalReturned > entry.amount) {
    throw new Error(`Cannot return more than original amount (${entry.amount}). Already returned: ${entry.returnedAmount}`);
  }

  const newReturn: AdvanceReturn = {
    id: `ret_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    date: new Date().toISOString().split('T')[0],
    amount,
    method,
    notes,
    recordedBy,
    createdAt: new Date().toISOString(),
  };

  const updatedEntry = {
    ...entry,
    returnedAmount: totalReturned,
    pendingAmount: entry.amount - totalReturned,
    returnHistory: [...(entry.returnHistory || []), newReturn],
    status: totalReturned === entry.amount ? 'settled' : 'active',
    updatedAt: new Date().toISOString(),
  };

  return updatedEntry;
}

/**
 * Get pending amount still outstanding
 */
export function getPendingAmount(entry: AdvanceBalanceEntry): number {
  return Math.max(0, entry.amount - entry.returnedAmount);
}

/**
 * Get settlement percentage (how much has been returned)
 */
export function getReturnPercentage(entry: AdvanceBalanceEntry): number {
  if (entry.amount <= 0) return 100;
  return Math.round((entry.returnedAmount / entry.amount) * 100);
}

/**
 * Check if advance is fully settled
 */
export function isFullySettled(entry: AdvanceBalanceEntry): boolean {
  return entry.returnedAmount >= entry.amount && entry.status === 'settled';
}

/**
 * Get return summary
 */
export function getReturnSummary(entry: AdvanceBalanceEntry): {
  originalAmount: number;
  returnedAmount: number;
  pendingAmount: number;
  returnPercentage: number;
  returnCount: number;
  isFullySettled: boolean;
  lastReturnDate?: string;
} {
  const lastReturn = entry.returnHistory?.[entry.returnHistory.length - 1];

  return {
    originalAmount: entry.amount,
    returnedAmount: entry.returnedAmount,
    pendingAmount: getPendingAmount(entry),
    returnPercentage: getReturnPercentage(entry),
    returnCount: entry.returnHistory?.length || 0,
    isFullySettled: isFullySettled(entry),
    lastReturnDate: lastReturn?.date,
  };
}

/**
 * Validate return amount
 */
export function validateReturn(
  entry: AdvanceBalanceEntry,
  amount: number,
  method: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (amount <= 0) {
    errors.push('Return amount must be greater than 0');
  }

  const pending = getPendingAmount(entry);
  if (amount > pending) {
    errors.push(`Cannot return more than pending amount (${pending}). Only ${pending} is pending.`);
  }

  if (!method || method.trim().length === 0) {
    errors.push('Payment method is required');
  }

  const validMethods = ['cash', 'bank', 'digital', 'adjustment'];
  if (!validMethods.includes(method.toLowerCase())) {
    errors.push(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a summary of all advances for a person
 */
export interface PersonAdvanceSummary {
  email: string;
  name: string;
  totalAdvances: number;
  totalReturned: number;
  totalPending: number;
  advanceCount: number;
  settledCount: number;
  averageAmount: number;
  oldestAdvanceDate: string;
}

export function summarizePersonAdvances(
  personEmail: string,
  entries: AdvanceBalanceEntry[],
  isPerspectiveGiver: boolean // true = advances given to this person, false = advances received from this person
): PersonAdvanceSummary {
  const relevantEntries = isPerspectiveGiver
    ? entries.filter(e => e.receiverEmail === personEmail)
    : entries.filter(e => e.giverEmail === personEmail);

  const totalAdvances = relevantEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalReturned = relevantEntries.reduce((sum, e) => sum + e.returnedAmount, 0);
  const totalPending = relevantEntries.reduce((sum, e) => sum + getPendingAmount(e), 0);
  const settledCount = relevantEntries.filter(e => e.status === 'settled').length;

  const oldestAdvance = relevantEntries.reduce((oldest, current) => {
    return new Date(current.transactionDate) < new Date(oldest.transactionDate) ? current : oldest;
  });

  return {
    email: personEmail,
    name: relevantEntries[0]?.[isPerspectiveGiver ? 'receiverName' : 'giverName'] || 'Unknown',
    totalAdvances,
    totalReturned,
    totalPending,
    advanceCount: relevantEntries.length,
    settledCount,
    averageAmount: relevantEntries.length > 0 ? Math.round(totalAdvances / relevantEntries.length) : 0,
    oldestAdvanceDate: oldestAdvance?.transactionDate || new Date().toISOString(),
  };
}

/**
 * Generate return receipt/summary
 */
export function generateReturnReceipt(
  entry: AdvanceBalanceEntry,
  returnRecord: AdvanceReturn
): string {
  const summary = getReturnSummary(entry);

  return `
ADVANCE RETURN RECEIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From: ${entry.giverName} (${entry.giverEmail})
To: ${entry.receiverName} (${entry.receiverEmail})

Original Advance: Rs. ${entry.amount.toLocaleString()}
Return Amount: Rs. ${returnRecord.amount.toLocaleString()}
Payment Method: ${returnRecord.method}
Date: ${returnRecord.date}

Progress:
- Total Returned: Rs. ${summary.returnedAmount.toLocaleString()} (${summary.returnPercentage}%)
- Pending: Rs. ${summary.pendingAmount.toLocaleString()}
- Status: ${summary.isFullySettled ? '✅ SETTLED' : '⏳ PENDING'}

Notes: ${returnRecord.notes || 'None'}
Recorded by: ${returnRecord.recordedBy}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}
