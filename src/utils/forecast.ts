import { Expense } from '../types';
import { getMonthlySpending, getSpendingTrends } from './trends';
import { getYear, getMonth, subMonths } from 'date-fns';

/** Forecast next month spending based on 3-month average of COMPLETE months only. */
export function forecastNextMonth(expenses: Expense[]): number {
  const today = new Date();
  const thisMonth = getMonth(today) + 1;
  const thisYear = getYear(today);

  // Use last 3 complete months (not current month)
  const lastMonth = getMonthlySpending(
    expenses,
    thisMonth === 1 ? 12 : thisMonth - 1,
    thisMonth === 1 ? thisYear - 1 : thisYear
  ).total;

  const twoMonthsAgo = getMonthlySpending(
    expenses,
    thisMonth <= 2 ? 12 + (thisMonth - 2) : thisMonth - 2,
    thisMonth <= 2 ? thisYear - 1 : thisYear
  ).total;

  const threeMonthsAgo = getMonthlySpending(
    expenses,
    thisMonth <= 3 ? 12 + (thisMonth - 3) : thisMonth - 3,
    thisMonth <= 3 ? thisYear - 1 : thisYear
  ).total;

  // Average of last 3 complete months
  return Math.round((lastMonth + twoMonthsAgo + threeMonthsAgo) / 3);
}

/** Savings potential if spending matches historical average of complete months. */
export interface SavingsPotential {
  currentOnTrack: number;    // What you're on track to spend this month
  historicalAverage: number; // 3-month average of complete months (excluding current)
  potentialSavings: number;  // Difference
}

export function calculateSavingsPotential(expenses: Expense[]): SavingsPotential {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const thisMonth = getMonth(today) + 1;
  const thisYear = getYear(today);
  const currentSpent = getMonthlySpending(expenses, thisMonth, thisYear).total;

  // Project current month to end
  const daysElapsedFraction = dayOfMonth / daysInMonth;
  const currentOnTrack = daysElapsedFraction > 0 ? Math.round(currentSpent / daysElapsedFraction) : 0;

  // Get last 3 complete months average
  const lastMonth = getMonthlySpending(
    expenses,
    thisMonth === 1 ? 12 : thisMonth - 1,
    thisMonth === 1 ? thisYear - 1 : thisYear
  ).total;

  const twoMonthsAgo = getMonthlySpending(
    expenses,
    thisMonth <= 2 ? 12 + (thisMonth - 2) : thisMonth - 2,
    thisMonth <= 2 ? thisYear - 1 : thisYear
  ).total;

  const threeMonthsAgo = getMonthlySpending(
    expenses,
    thisMonth <= 3 ? 12 + (thisMonth - 3) : thisMonth - 3,
    thisMonth <= 3 ? thisYear - 1 : thisYear
  ).total;

  // Average of last 3 complete months (correct calculation)
  const historicalAverage = Math.round((lastMonth + twoMonthsAgo + threeMonthsAgo) / 3);
  const potentialSavings = Math.max(currentOnTrack - historicalAverage, 0);

  return {
    currentOnTrack,
    historicalAverage,
    potentialSavings,
  };
}

/** Budget utilization: % of monthly budget used so far. */
export function budgetUtilization(monthlyBudget: number, currentSpending: number): number {
  if (monthlyBudget <= 0) return 0;
  const percentage = (currentSpending / monthlyBudget) * 100;
  return Math.min(100, Math.round(percentage)); // Cap at 100%
}

/** Days remaining in month. */
export function daysRemainingInMonth(): number {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Math.max(0, lastDay - today.getDate());
}

/** Daily spend rate for current month based on days elapsed. */
export function dailySpendRate(expenses: Expense[]): number {
  const today = new Date();
  const daysElapsed = today.getDate();

  if (daysElapsed <= 0) return 0;

  const thisMonth = getMonth(today) + 1;
  const thisYear = getYear(today);
  const currentSpent = getMonthlySpending(expenses, thisMonth, thisYear).total;

  return Math.round(currentSpent / daysElapsed);
}

/** Spending velocity: is it accelerating or decelerating? */
export interface SpendingVelocity {
  firstWeekDaily: number;   // Average daily spend, first week (1-7)
  lastWeekDaily: number;    // Average daily spend, last 7 days
  isAccelerating: boolean;  // true = spending faster
  changePercent: number;    // % change
}

export function getSpendingVelocity(expenses: Expense[]): SpendingVelocity {
  const today = new Date();
  const thisMonth = getMonth(today) + 1;
  const thisYear = getYear(today);

  // First week (1-7th of month)
  const firstWeekExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear && d.getDate() >= 1 && d.getDate() <= 7 && e.status !== 'rejected' && e.status !== 'pending';
  });
  const firstWeekTotal = firstWeekExpenses.reduce((s, e) => s + e.amount, 0);
  // Divide by actual days elapsed in first week (1-7, or up to today if before 7th)
  const firstWeekDaysElapsed = Math.min(7, today.getDate());
  const firstWeekDaily = firstWeekDaysElapsed > 0 ? Math.round(firstWeekTotal / firstWeekDaysElapsed) : 0;

  // Last 7 days (more accurate velocity)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const lastWeekExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= sevenDaysAgo && d <= today && e.status !== 'rejected' && e.status !== 'pending';
  });
  const lastWeekTotal = lastWeekExpenses.reduce((s, e) => s + e.amount, 0);
  const lastWeekDaily = lastWeekExpenses.length > 0 ? Math.round(lastWeekTotal / 7) : 0;

  const changePercent = firstWeekDaily > 0 ? ((lastWeekDaily - firstWeekDaily) / firstWeekDaily) * 100 : 0;

  return {
    firstWeekDaily,
    lastWeekDaily,
    isAccelerating: lastWeekDaily > firstWeekDaily,
    changePercent,
  };
}
