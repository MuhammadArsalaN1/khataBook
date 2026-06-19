import { BudgetPool, Expense } from '../types';

const counted = (s?: string) => s !== 'rejected' && s !== 'pending';

/** Calculate spending in a pool (approved/settled expenses only). */
export function poolSpent(pool: BudgetPool, expenses: Expense[]): number {
  return expenses
    .filter(
      e =>
        counted(e.status) &&
        pool.linkedCategories.includes(e.category) &&
        new Date(e.date).getMonth() + 1 === pool.month &&
        new Date(e.date).getFullYear() === pool.year
    )
    .reduce((s, e) => s + e.amount, 0);
}

/** Pool with calculated spent/remaining. */
export interface PoolWithBalance extends BudgetPool {
  spent: number;
  remaining: number;
  percentUsed: number;
  isAlerted: boolean;
}

export function withBalance(pool: BudgetPool, expenses: Expense[]): PoolWithBalance {
  const spent = poolSpent(pool, expenses);
  const remaining = pool.allocatedAmount - spent;
  const percentUsed = pool.allocatedAmount > 0 ? (spent / pool.allocatedAmount) * 100 : 0;
  return {
    ...pool,
    spent,
    remaining,
    percentUsed,
    isAlerted: percentUsed >= pool.alertThreshold,
  };
}

/** Pool status summary. */
export interface PoolsSummary {
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  alertedPools: number; // pools at or over threshold
  poolCount: number;
}

export function poolsSummary(pools: BudgetPool[], expenses: Expense[]): PoolsSummary {
  const enriched = pools.map(p => withBalance(p, expenses));
  return {
    totalAllocated: enriched.reduce((s, p) => s + p.allocatedAmount, 0),
    totalSpent: enriched.reduce((s, p) => s + p.spent, 0),
    totalRemaining: enriched.reduce((s, p) => s + p.remaining, 0),
    alertedPools: enriched.filter(p => p.isAlerted).length,
    poolCount: enriched.length,
  };
}
