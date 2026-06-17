import { Expense, ExpenseType } from '../types';
import { subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface CategoryTrend {
  category: string;
  type: ExpenseType;
  thisMonth: number;
  lastMonth: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface RecurringPattern {
  category: string;
  type: ExpenseType;
  frequency: number; // times per month
  averageAmount: number;
  lastOccurrence: string;
}

interface TagInsight {
  tag: string;
  count: number;
  totalAmount: number;
  categories: string[];
}

interface InsightReport {
  topCategories: CategoryTrend[];
  recurringPatterns: RecurringPattern[];
  tagInsights: TagInsight[];
  spendingVelocity: number; // average per day
  costVariability: number; // standard deviation as % of average
}

export function getCategoryTrends(expenses: Expense[], months: number = 2): CategoryTrend[] {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const categories = new Set<string>();
  expenses.forEach(e => categories.add(e.category));

  const trends: CategoryTrend[] = [];

  categories.forEach(category => {
    const thisMonthExpenses = expenses.filter(
      e => e.category === category &&
      isWithinInterval(new Date(e.date), { start: thisMonthStart, end: thisMonthEnd }) &&
      e.status !== 'rejected'
    );

    const lastMonthExpenses = expenses.filter(
      e => e.category === category &&
      isWithinInterval(new Date(e.date), { start: lastMonthStart, end: lastMonthEnd }) &&
      e.status !== 'rejected'
    );

    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const change = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    trends.push({
      category,
      type: thisMonthExpenses[0]?.type || 'personal',
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      change,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    });
  });

  return trends.sort((a, b) => b.thisMonth - a.thisMonth);
}

export function detectRecurringPatterns(expenses: Expense[], minFrequency: number = 2): RecurringPattern[] {
  const patterns: RecurringPattern[] = [];
  const categoryOccurrences: Record<string, { dates: Date[]; amounts: number[] }> = {};

  expenses.forEach(exp => {
    if (exp.status === 'rejected') return;
    if (!categoryOccurrences[exp.category]) {
      categoryOccurrences[exp.category] = { dates: [], amounts: [] };
    }
    categoryOccurrences[exp.category].dates.push(new Date(exp.date));
    categoryOccurrences[exp.category].amounts.push(exp.amount);
  });

  Object.entries(categoryOccurrences).forEach(([category, data]) => {
    const frequency = data.dates.length;
    if (frequency >= minFrequency) {
      const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / frequency;
      const lastDate = new Date(Math.max(...data.dates.map(d => d.getTime())));

      patterns.push({
        category,
        type: expenses.find(e => e.category === category)?.type || 'personal',
        frequency: frequency / 6, // approximate monthly
        averageAmount: avgAmount,
        lastOccurrence: lastDate.toISOString(),
      });
    }
  });

  return patterns.sort((a, b) => b.frequency - a.frequency);
}

export function getTagInsights(expenses: Expense[]): TagInsight[] {
  const tagMap: Record<string, { count: number; amount: number; categories: Set<string> }> = {};

  expenses.forEach(exp => {
    if (exp.status === 'rejected' || !exp.tags) return;
    exp.tags.forEach(tag => {
      if (!tagMap[tag]) {
        tagMap[tag] = { count: 0, amount: 0, categories: new Set() };
      }
      tagMap[tag].count += 1;
      tagMap[tag].amount += exp.amount;
      tagMap[tag].categories.add(exp.category);
    });
  });

  return Object.entries(tagMap)
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      totalAmount: data.amount,
      categories: Array.from(data.categories),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export function generateInsightReport(expenses: Expense[]): InsightReport {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const thisMonthExpenses = expenses.filter(
    e => isWithinInterval(new Date(e.date), { start: thisMonthStart, end: thisMonthEnd }) &&
    e.status !== 'rejected'
  );

  const daysInMonth = Math.ceil((thisMonthEnd.getTime() - thisMonthStart.getTime()) / (1000 * 60 * 60 * 24));
  const totalSpent = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const spendingVelocity = totalSpent / daysInMonth;

  // Calculate variability (coefficient of variation)
  const amounts = thisMonthExpenses.map(e => e.amount);
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length || 0;
  const variance = amounts.reduce((sum, x) => sum + Math.pow(x - avgAmount, 2), 0) / amounts.length || 0;
  const stdDev = Math.sqrt(variance);
  const costVariability = avgAmount > 0 ? (stdDev / avgAmount) * 100 : 0;

  return {
    topCategories: getCategoryTrends(expenses).slice(0, 5),
    recurringPatterns: detectRecurringPatterns(expenses).slice(0, 5),
    tagInsights: getTagInsights(expenses).slice(0, 5),
    spendingVelocity,
    costVariability,
  };
}
