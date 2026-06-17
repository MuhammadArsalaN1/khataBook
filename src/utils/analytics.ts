import { Expense, ExpenseType, MonthlyComparison } from '../types';
import { startOfMonth, endOfMonth, startOfWeek, startOfYear, format, subMonths } from 'date-fns';

export function filterByDateRange(expenses: Expense[], from: Date, to: Date): Expense[] {
  return expenses.filter(e => {
    const d = new Date(e.date);
    return d >= from && d <= to;
  });
}

export function sumAmounts(expenses: Expense[]): number {
  return expenses.reduce((acc, e) => acc + e.amount, 0);
}

export function sumByType(expenses: Expense[]): Record<ExpenseType, number> {
  return {
    personal: sumAmounts(expenses.filter(e => e.type === 'personal')),
    office: sumAmounts(expenses.filter(e => e.type === 'office')),
    farm: sumAmounts(expenses.filter(e => e.type === 'farm')),
  };
}

export function getDashboardStats(expenses: Expense[]) {
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const approved = expenses.filter(e => e.status !== 'rejected');

  const todayExp = approved.filter(e => e.date.startsWith(todayStr));
  const weekExp = filterByDateRange(approved, weekStart, now);
  const monthExp = filterByDateRange(approved, monthStart, now);
  const yearExp = filterByDateRange(approved, yearStart, now);

  const monthTotal = sumAmounts(monthExp);
  const days = now.getDate();

  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const lastMonthTotal = sumAmounts(filterByDateRange(approved, lastMonthStart, lastMonthEnd));

  const change = lastMonthTotal > 0
    ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100
    : 0;

  return {
    today: sumAmounts(todayExp),
    weekly: sumAmounts(weekExp),
    monthly: monthTotal,
    yearly: sumAmounts(yearExp),
    byType: sumByType(monthExp),
    avgDaily: days > 0 ? monthTotal / days : 0,
    monthVsLast: { change, lastMonth: lastMonthTotal },
  };
}

export function getMonthlyComparisons(expenses: Expense[], count: number): MonthlyComparison[] {
  const now = new Date();
  const approved = expenses.filter(e => e.status !== 'rejected');
  const result: MonthlyComparison[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const month = subMonths(now, i);
    const from = startOfMonth(month);
    const to = endOfMonth(month);
    const exp = filterByDateRange(approved, from, to);
    const byType = sumByType(exp);
    result.push({
      label: format(month, 'MMM yy'),
      total: sumAmounts(exp),
      ...byType,
    });
  }

  for (let i = 1; i < result.length; i++) {
    const prev = result[i - 1].total;
    result[i].change = prev > 0 ? ((result[i].total - prev) / prev) * 100 : 0;
  }

  return result;
}

export function getCategoryBreakdown(expenses: Expense[], type?: ExpenseType) {
  const filtered = type ? expenses.filter(e => e.type === type) : expenses;
  const map: Record<string, number> = {};
  filtered.forEach(e => {
    map[e.category] = (map[e.category] ?? 0) + e.amount;
  });
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getUserContribution(expenses: Expense[]) {
  const map: Record<string, number> = {};
  expenses.filter(e => e.status !== 'rejected').forEach(e => {
    map[e.enteredBy] = (map[e.enteredBy] ?? 0) + e.amount;
  });
  return map;
}

export function getSmartInsights(expenses: Expense[]) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthExp = filterByDateRange(expenses.filter(e => e.status !== 'rejected'), monthStart, now);
  const cats = getCategoryBreakdown(monthExp);
  const comparisons = getMonthlyComparisons(expenses, 6);

  const highestCat = cats[0]?.category ?? 'N/A';
  const avgMonthly = comparisons.reduce((a, c) => a + c.total, 0) / (comparisons.length || 1);

  const lastTwo = comparisons.slice(-2);
  const trend = lastTwo.length === 2
    ? lastTwo[1].total > lastTwo[0].total ? 'increasing' : 'decreasing'
    : 'stable';

  const userMap: Record<string, number> = {};
  expenses.forEach(e => { userMap[e.enteredBy] = (userMap[e.enteredBy] ?? 0) + 1; });
  const mostActive = Object.entries(userMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  const lowestMonth = comparisons.reduce((min, c) =>
    c.total < min.total ? c : min, comparisons[0] ?? { label: 'N/A', total: 0 });

  return { highestCat, avgMonthly, trend, mostActive, lowestMonth: lowestMonth?.label };
}
