import { Expense, Income, Budget } from '../types';
import { addDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface DailyProjection {
  date: string;
  day: number;
  projectedBalance: number;
  expectedIncome: number;
  expectedExpense: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface CashFlowProjection {
  currentBalance: number;
  projectedEnd: number;
  dailyProjection: DailyProjection[];
  riskLevel: 'low' | 'medium' | 'high';
  daysToNegative: number | null;
}

export function projectCashFlow(
  currentExpenses: Expense[],
  incomes: Income[],
  budgets: Budget[],
  startingBalance: number = 0
): CashFlowProjection {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate average daily expense from historical data
  const thisMonthExpenses = currentExpenses.filter(
    e => isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd }) &&
    e.status !== 'rejected'
  );

  const totalExpense = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const avgDailyExpense = daysInMonth > 0 ? totalExpense / daysInMonth : 0;

  // Get budget targets
  const totalBudget = budgets.filter(b => b.month === now.getMonth() + 1).reduce((sum, b) => sum + b.limit, 0);
  const budgetDailyExpense = daysInMonth > 0 ? totalBudget / daysInMonth : 0;

  // Get expected income
  const monthIncomes = incomes.filter(i => i.month === now.getMonth() + 1);
  const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
  const daysWithIncome = new Set(monthIncomes.map(i => 1)).size; // Assuming income at start
  const dailyIncome = daysWithIncome > 0 ? totalIncome / daysInMonth : 0;

  // Project daily cash flow
  const dailyProjection: DailyProjection[] = [];
  let balance = startingBalance + totalIncome; // Assume income received at month start
  let daysToNegative: number | null = null;

  for (let i = 1; i <= daysInMonth; i++) {
    const date = addDays(monthStart, i - 1);
    const projectedExpense = i === 1 ? 0 : avgDailyExpense; // No expense on first day
    balance -= projectedExpense;

    if (balance < 0 && daysToNegative === null) {
      daysToNegative = i;
    }

    const status = balance < 0 ? 'critical' : balance < projectedExpense * 3 ? 'warning' : 'healthy';

    dailyProjection.push({
      date: date.toISOString(),
      day: i,
      projectedBalance: Math.max(0, balance),
      expectedIncome: i === 1 ? totalIncome : 0,
      expectedExpense: projectedExpense,
      status,
    });
  }

  // Determine overall risk
  const hasNegativeDay = daysToNegative !== null;
  const endingBalance = balance;
  const riskLevel = hasNegativeDay ? 'high' : endingBalance < totalBudget * 0.2 ? 'medium' : 'low';

  return {
    currentBalance: startingBalance + totalIncome,
    projectedEnd: Math.max(0, endingBalance),
    dailyProjection,
    riskLevel,
    daysToNegative,
  };
}

export function getCashFlowInsights(projection: CashFlowProjection): string {
  if (projection.riskLevel === 'high') {
    return `⚠️ Cash flow critical: May run out of funds on day ${projection.daysToNegative}`;
  }
  if (projection.riskLevel === 'medium') {
    return `📊 Moderate cash flow: Ending balance is Rs. ${projection.projectedEnd.toLocaleString()}`;
  }
  return `✓ Healthy cash flow: Sufficient funds throughout month`;
}

export function calculateRunway(expenses: Expense[], wallets: any[]): number {
  // Calculate total available cash
  const totalWallet = wallets.reduce((sum, w) => sum + w.balance, 0);

  // Calculate average daily expense
  const last30Days = expenses.filter(e => {
    const expDate = new Date(e.date);
    const today = new Date();
    const diff = (today.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && e.status !== 'rejected';
  });

  const avgDailyExpense = last30Days.length > 0
    ? last30Days.reduce((sum, e) => sum + e.amount, 0) / 30
    : 0;

  if (avgDailyExpense <= 0) return 999; // Infinite runway if no expenses

  return Math.floor(totalWallet / avgDailyExpense);
}
