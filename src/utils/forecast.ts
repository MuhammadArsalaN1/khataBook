import { Expense } from '../types';
import { getMonthlySpending, getSpendingTrends } from './trends';
import { getYear, getMonth } from 'date-fns';

/** Forecast next month spending based on 3-month average. */
export function forecastNextMonth(expenses: Expense[]): number {
  const today = new Date();
  const thisMonth = getMonth(today) + 1;
  const thisYear = getYear(today);

  const current = getMonthlySpending(expenses, thisMonth, thisYear).total;
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

  // 3-month average
  return Math.round((current + lastMonth + twoMonthsAgo) / 3);
}

/** Savings potential if spending matches historical average. */
export interface SavingsPotential {
  currentOnTrack: number;   // What you're on track to spend this month
  historicalAverage: number; // 3-month average
  potentialSavings: number;  // Difference
}

export function calculateSavingsPotential(expenses: Expense[]): SavingsPotential {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const thisMonth = getMonth(today) + 1;
  const thisYear = getYear(today);
  const currentSpent = getMonthlySpending(expenses, thisMonth, thisYear).total;

  // Project to end of month
  const currentOnTrack = Math.round((currentSpent / dayOfMonth) * daysInMonth);

  // Get 3-month average
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

  const historicalAverage = Math.round((currentSpent + lastMonth + twoMonthsAgo) / 3);
  const potentialSavings = Math.max(currentOnTrack - historicalAverage, 0);

  return {
    currentOnTrack,
    historicalAverage,
    potentialSavings,
  };
}

/** Budget utilization: % of monthly budget used so far. */
export function budgetUtilization(monthlyBudget: number, currentSpending: number): number {
  if (monthlyBudget === 0) return 0;
  return Math.round((currentSpending / monthlyBudget) * 100);
}

/** Days remaining in month. */
export function daysRemainingInMonth(): number {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return lastDay - today.getDate();
}

/** Daily spend rate for current month. */
export function dailySpendRate(expenses: Expense[]): number {
  const today = new Date();
  const daysElapsed = today.getDate();

  const thisMonth = getMonth(today) + 1;
  const thisYear = getYear(today);
  const currentSpent = getMonthlySpending(expenses, thisMonth, thisYear).total;

  return daysElapsed > 0 ? Math.round(currentSpent / daysElapsed) : 0;
}

/** Spending velocity: is it accelerating or decelerating? */
export interface SpendingVelocity {
  firstWeekDaily: number;   // Average daily spend, first week
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
    return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear && d.getDate() <= 7;
  });
  const firstWeekTotal = firstWeekExpenses.reduce((s, e) => s + e.amount, 0);
  const firstWeekDaily = firstWeekExpenses.length > 0 ? Math.round(firstWeekTotal / Math.min(7, today.getDate())) : 0;

  // Last 7 days
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const lastWeekExpenses = expenses.filter(e => new Date(e.date) >= sevenDaysAgo && new Date(e.date) <= today);
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
