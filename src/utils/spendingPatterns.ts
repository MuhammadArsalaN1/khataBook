import { Expense } from '../types';
import { subMonths, startOfMonth, endOfMonth, isBefore, isAfter, differenceInDays } from 'date-fns';

interface DailySpending {
  date: string;
  amount: number;
  category: string;
  type: string;
}

interface CategoryPattern {
  category: string;
  type: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'irregular';
  averageAmount: number;
  lastOccurrence: string;
  daysSinceLastOccurrence: number;
  predictedNextDate: string;
  confidence: number;
  occurrences: number;
}

interface SpendingPrediction {
  category: string;
  type: string;
  predictedAmount: number;
  predictedDate: string;
  daysUntil: number;
  confidence: number;
  reason: string;
}

interface SmartInsight {
  patterns: CategoryPattern[];
  predictions: SpendingPrediction[];
  savingsPotential: string;
  riskWarning: string | null;
  recommendation: string;
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
}

export function analyzeSpendingPatterns(expenses: Expense[]): SmartInsight {
  const twoMonthsAgo = subMonths(new Date(), 2);
  const recentExpenses = expenses.filter(e => {
    const expDate = new Date(e.date);
    return isAfter(expDate, twoMonthsAgo) && e.status !== 'rejected' && e.status !== 'pending';
  });

  if (recentExpenses.length === 0) {
    return {
      patterns: [],
      predictions: [],
      savingsPotential: 'Insufficient data',
      riskWarning: null,
      recommendation: 'Start tracking expenses to get intelligent predictions',
      healthStatus: 'good',
    };
  }

  // Group expenses by category
  const categoryGroups = groupByCategory(recentExpenses);
  const patterns = detectPatterns(categoryGroups);
  const predictions = generatePredictions(patterns);
  const insight = generateInsight(patterns, predictions, recentExpenses);

  return {
    patterns,
    predictions: predictions.slice(0, 5),
    savingsPotential: insight.savings,
    riskWarning: insight.warning,
    recommendation: insight.recommendation,
    healthStatus: insight.health,
  };
}

function groupByCategory(expenses: Expense[]): Record<string, Expense[]> {
  const grouped: Record<string, Expense[]> = {};
  expenses.forEach(exp => {
    const key = `${exp.category}_${exp.type}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(exp);
  });
  return grouped;
}

function detectPatterns(categoryGroups: Record<string, Expense[]>): CategoryPattern[] {
  const patterns: CategoryPattern[] = [];
  const now = new Date();

  Object.entries(categoryGroups).forEach(([key, expenses]) => {
    if (expenses.length < 2) return;

    const [category, type] = key.split('_');
    const sorted = expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastOccurrence = sorted[0].date;
    const daysSinceLast = differenceInDays(now, new Date(lastOccurrence));

    // Calculate average amount
    const averageAmount = expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length;

    // Detect frequency pattern
    const intervals: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const diff = differenceInDays(new Date(sorted[i].date), new Date(sorted[i + 1].date));
      if (diff > 0) intervals.push(diff);
    }

    const frequency = detectFrequency(intervals);
    const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b) / intervals.length : 0;
    const nextDate = calculateNextDate(lastOccurrence, frequency, avgInterval);
    const confidence = calculateConfidence(expenses.length, intervals);

    patterns.push({
      category,
      type,
      frequency,
      averageAmount,
      lastOccurrence,
      daysSinceLastOccurrence: daysSinceLast,
      predictedNextDate: nextDate,
      confidence,
      occurrences: expenses.length,
    });
  });

  return patterns.sort((a, b) => b.confidence - a.confidence);
}

function detectFrequency(intervals: number[]): CategoryPattern['frequency'] {
  if (intervals.length === 0) return 'irregular';

  const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
  const stdDev = Math.sqrt(intervals.reduce((sq, n) => sq + Math.pow(n - avgInterval, 2), 0) / intervals.length);
  const variance = stdDev / avgInterval;

  // If variance is too high, it's irregular
  if (variance > 0.5) return 'irregular';

  if (avgInterval < 1.5) return 'daily';
  if (avgInterval < 8) return 'weekly';
  if (avgInterval < 15) return 'biweekly';
  if (avgInterval < 35) return 'monthly';
  return 'irregular';
}

function calculateNextDate(lastDate: string, frequency: string, avgInterval: number): string {
  const last = new Date(lastDate);
  let next = new Date(last);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'irregular':
      next.setDate(next.getDate() + Math.round(avgInterval || 7));
      break;
  }

  return next.toISOString().split('T')[0];
}

function calculateConfidence(occurrences: number, intervals: number[]): number {
  if (occurrences < 2) return 0.3;
  if (occurrences < 5) return 0.5;
  if (occurrences < 10) return 0.7;

  // Check consistency of intervals
  if (intervals.length === 0) return 0.5;
  const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = Math.max(0, 1 - (stdDev / avgInterval));

  return Math.min(0.95, 0.5 + (occurrences * 0.05) + (consistencyScore * 0.3));
}

function generatePredictions(patterns: CategoryPattern[]): SpendingPrediction[] {
  const now = new Date();
  const predictions: SpendingPrediction[] = [];

  patterns.forEach(pattern => {
    const nextDate = new Date(pattern.predictedNextDate);
    const daysUntil = differenceInDays(nextDate, now);

    // Only predict near-future expenses (within 30 days)
    if (daysUntil >= -5 && daysUntil <= 30) {
      const reason = generateReason(pattern);
      predictions.push({
        category: pattern.category,
        type: pattern.type,
        predictedAmount: pattern.averageAmount,
        predictedDate: pattern.predictedNextDate,
        daysUntil: Math.max(0, daysUntil),
        confidence: pattern.confidence,
        reason,
      });
    }
  });

  return predictions.sort((a, b) => a.daysUntil - b.daysUntil);
}

function generateReason(pattern: CategoryPattern): string {
  const freq = pattern.frequency;
  const occurrences = pattern.occurrences;

  if (freq === 'daily') return `Daily expense (${occurrences} occurrences)`;
  if (freq === 'weekly') return `Weekly expense (${occurrences} occurrences)`;
  if (freq === 'biweekly') return `Biweekly expense (${occurrences} occurrences)`;
  if (freq === 'monthly') return `Monthly expense (${occurrences} occurrences)`;
  return `Recurring pattern detected (${occurrences} occurrences)`;
}

function generateInsight(patterns: CategoryPattern[], predictions: SpendingPrediction[], expenses: Expense[]): {
  savings: string;
  warning: string | null;
  recommendation: string;
  health: 'excellent' | 'good' | 'warning' | 'critical';
} {
  // Calculate upcoming expenses
  const upcomingTotal = predictions
    .filter(p => p.daysUntil <= 7)
    .reduce((sum, p) => sum + p.predictedAmount, 0);

  // Identify expensive categories
  const expensiveCategories = patterns
    .filter(p => p.averageAmount > 2000)
    .sort((a, b) => b.averageAmount - a.averageAmount)
    .slice(0, 2);

  // Identify frequent categories
  const frequentCategories = patterns
    .filter(p => p.occurrences > 5 && (p.frequency === 'daily' || p.frequency === 'weekly'))
    .slice(0, 2);

  let recommendation = 'Maintain your spending habits';
  let warning: string | null = null;
  let health: 'excellent' | 'good' | 'warning' | 'critical' = 'good';

  // Generate recommendations
  if (frequentCategories.length > 0) {
    const topFrequent = frequentCategories[0];
    const potentialSavings = topFrequent.averageAmount * 0.1;
    recommendation = `Consider reducing ${topFrequent.category} expenses by ~10% (save Rs. ${Math.round(potentialSavings)}/occurrence)`;
  }

  if (expensiveCategories.length > 0) {
    const topExpensive = expensiveCategories[0];
    warning = `⚠️ High expense alert: ${topExpensive.category} averages Rs. ${Math.round(topExpensive.averageAmount)}. Consider alternatives.`;
    health = 'warning';
  }

  if (predictions.length > 5) {
    warning = `Multiple expenses predicted in next week (Rs. ${Math.round(upcomingTotal)}). Budget accordingly.`;
    health = 'warning';
  }

  const savings = frequentCategories.length > 0
    ? `Potential savings: Rs. ${Math.round(frequentCategories[0].averageAmount * 0.15)}/month from ${frequentCategories[0].category}`
    : 'Data needed for savings forecast';

  return { savings, warning, recommendation, health };
}

export function getVelocityInsight(patterns: CategoryPattern[], predictions: SpendingPrediction[]): {
  trend: 'accelerating' | 'stable' | 'decreasing';
  impact: string;
  action: string;
} {
  const upcomingDaily = predictions
    .filter(p => p.frequency === 'daily' || p.daysUntil <= 7)
    .reduce((sum, p) => sum + p.predictedAmount, 0) / Math.max(1, predictions.filter(p => p.daysUntil <= 7).length);

  const highFrequency = patterns.filter(p => p.frequency === 'daily' || p.frequency === 'weekly').length;
  const totalPatterns = patterns.length;
  const frequencyRatio = highFrequency / Math.max(1, totalPatterns);

  let trend: 'accelerating' | 'stable' | 'decreasing';
  let impact: string;
  let action: string;

  if (frequencyRatio > 0.6 && upcomingDaily > 5000) {
    trend = 'accelerating';
    impact = 'High frequency of expenses detected - spending is increasing';
    action = 'Review daily/weekly purchases and identify unnecessary spending';
  } else if (frequencyRatio > 0.4) {
    trend = 'stable';
    impact = 'Moderate expense frequency - spending is consistent';
    action = 'Monitor upcoming predicted expenses and adjust budget accordingly';
  } else {
    trend = 'decreasing';
    impact = 'Low frequency of expenses - spending is controlled';
    action = 'Continue current spending patterns, you\'re on track';
  }

  return { trend, impact, action };
}
