import { Advance, Expense } from '../types';

const counted = (s?: string) => s !== 'rejected' && s !== 'pending';

/** Money spent against a specific advance (approved/settled expenses only). */
export function advanceSpent(advance: Advance, expenses: Expense[]): number {
  return expenses
    .filter(e => e.advanceId === advance.id && counted(e.status))
    .reduce((s, e) => s + e.amount, 0);
}

/** Remaining balance of an advance = original amount − spent. */
export function advanceRemaining(advance: Advance, expenses: Expense[]): number {
  return advance.amount - advanceSpent(advance, expenses);
}

export interface AdvanceWithBalance extends Advance {
  spent: number;
  remaining: number;
  txCount: number;
}

export function withBalance(advance: Advance, expenses: Expense[]): AdvanceWithBalance {
  const linked = expenses.filter(e => e.advanceId === advance.id && counted(e.status));
  const spent = linked.reduce((s, e) => s + e.amount, 0);
  return { ...advance, spent, remaining: advance.amount - spent, txCount: linked.length };
}

/**
 * Running, all-time Main Balance (PKR), derived from events so it can never drift:
 *   + approved income
 *   − expenses paid from Main (no advanceId)
 *   − advances given        + amounts returned to you
 *   + advances received     − amounts you paid back
 */
export function computeMainBalance(incomes: any[], expenses: Expense[], advances: Advance[]): number {
  const income = incomes
    .filter(i => counted(i.status))
    .reduce((s, i) => s + (i.amount || 0), 0);

  const mainExpense = expenses
    .filter(e => counted(e.status) && !e.advanceId)
    .reduce((s, e) => s + e.amount, 0);

  let given = 0, givenReturned = 0, received = 0, receivedReturned = 0;
  advances.forEach(a => {
    if (a.direction === 'given') { given += a.amount; givenReturned += a.returnedAmount ?? 0; }
    else { received += a.amount; receivedReturned += a.returnedAmount ?? 0; }
  });

  return income - mainExpense - given + givenReturned + received - receivedReturned;
}

export interface FundsSummary {
  mainBalance: number;
  activeCount: number;
  totalGiven: number;       // outstanding (remaining) across active given advances
  totalReceived: number;    // outstanding across active received advances
  outstanding: number;      // total remaining across all active advances
}

export function fundsSummary(incomes: any[], expenses: Expense[], advances: Advance[]): FundsSummary {
  const active = advances.filter(a => a.status === 'active');
  let totalGiven = 0, totalReceived = 0, outstanding = 0;
  active.forEach(a => {
    const rem = advanceRemaining(a, expenses);
    outstanding += rem;
    if (a.direction === 'given') totalGiven += rem; else totalReceived += rem;
  });
  return {
    mainBalance: computeMainBalance(incomes, expenses, advances),
    activeCount: active.length,
    totalGiven,
    totalReceived,
    outstanding,
  };
}
