import { Expense, SpendingTrendPoint, SpendingComparison } from '../types';
import { format, subMonths, getYear, getMonth } from 'date-fns';

const counted = (s?: string) => s !== 'rejected' && s !== 'pending';

/** Get spending for a specific month. */
export function getMonthlySpending(
  expenses: Expense[],
  month: number,
  year: number
): { total: number; byType: Record<string, number>; byCategory: Record<string, number> } {
  const filtered = expenses.filter(e => {
    const d = new Date(e.date);
    return counted(e.status) && d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const byType = { personal: 0, office: 0, farm: 0 };
  const byCategory: Record<string, number> = {};

  filtered.forEach(e => {
    byType[e.type] = (byType[e.type] ?? 0) + e.amount;
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  });

  return {
    total: filtered.reduce((s, e) => s + e.amount, 0),
    byType,
    byCategory,
  };
}

/** Generate last N months of spending trends. */
export function getSpendingTrends(expenses: Expense[], months: number = 6): SpendingTrendPoint[] {
  const trends: SpendingTrendPoint[] = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(today, i);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const label = format(date, 'MMM yyyy');

    const spending = getMonthlySpending(expenses, month, year);

    // Calculate change from previous month
    let change = 0;
    let changeAmount = 0;
    if (i < months - 1) {
      const prevDate = subMonths(today, i + 1);
      const prevSpending = getMonthlySpending(expenses, prevDate.getMonth() + 1, prevDate.getFullYear());
      changeAmount = spending.total - prevSpending.total;
      change = prevSpending.total > 0 ? (changeAmount / prevSpending.total) * 100 : 0;
    }

    trends.push({
      month,
      year,
      label,
      total: spending.total,
      byType: spending.byType as any,
      byCategory: spending.byCategory,
      change,
      changeAmount,
    });
  }

  return trends;
}

/** Compare spending across different periods. */
export function compareSpending(expenses: Expense[]): SpendingComparison {
  const today = new Date();
  const thisMonth = getMonth(today) + 1;
  const thisYear = getYear(today);

  const current = getMonthlySpending(expenses, thisMonth, thisYear).total;
  const lastMonth = getMonthlySpending(expenses, thisMonth === 1 ? 12 : thisMonth - 1, thisMonth === 1 ? thisYear - 1 : thisYear).total;

  // 3-month average (current + last 2 months)
  const three1 = lastMonth;
  const three2 = getMonthlySpending(
    expenses,
    thisMonth === 1 ? 11 : thisMonth - 2,
    thisMonth <= 2 ? thisYear - 1 : thisYear
  ).total;
  const threeMonthAvg = (current + three1 + three2) / 3;

  // 6-month average
  let sixMonthTotal = current;
  for (let i = 1; i < 6; i++) {
    const m = thisMonth - i;
    const y = m <= 0 ? thisYear - 1 : thisYear;
    const month = m <= 0 ? 12 + m : m;
    sixMonthTotal += getMonthlySpending(expenses, month, y).total;
  }
  const sixMonthAvg = sixMonthTotal / 6;

  // Last year same month
  const lastYear = getMonthlySpending(expenses, thisMonth, thisYear - 1).total;

  const percentChange = lastMonth > 0 ? ((current - lastMonth) / lastMonth) * 100 : 0;

  return {
    thisMonth: current,
    lastMonth,
    threeMonthAvg,
    sixMonthAvg,
    lastYear,
    percentChange,
  };
}

/** Category breakdown for current month. */
export function getCategoryBreakdown(expenses: Expense[]): Record<string, { amount: number; percent: number }> {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const spending = getMonthlySpending(expenses, month, year);
  const total = spending.total || 1;

  const breakdown: Record<string, { amount: number; percent: number }> = {};
  Object.entries(spending.byCategory).forEach(([cat, amount]) => {
    breakdown[cat] = {
      amount,
      percent: (amount / total) * 100,
    };
  });

  return breakdown;
}

/** Type breakdown for current month. */
export function getTypeBreakdown(expenses: Expense[]): Record<string, { amount: number; percent: number }> {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const spending = getMonthlySpending(expenses, month, year);
  const total = spending.total || 1;

  const breakdown: Record<string, { amount: number; percent: number }> = {};
  Object.entries(spending.byType).forEach(([type, amount]) => {
    breakdown[type] = {
      amount,
      percent: (amount / total) * 100,
    };
  });

  return breakdown;
}
