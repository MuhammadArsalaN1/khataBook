import { Advance, Expense } from '../types';
import { differenceInDays } from 'date-fns';

const counted = (s?: string) => s !== 'rejected' && s !== 'pending';

/**
 * Comprehensive advance tracking with interest, settlement history, and analytics
 */

export interface AdvanceAnalytics {
  id: string;
  personName: string;
  direction: 'given' | 'received';
  originalAmount: number;
  spent: number;
  remaining: number;
  returned: number;
  status: string;
  daysActive: number;
  daysSinceLastActivity: number;
  interestAccrued: number;
  totalWithInterest: number;
  settlementProgress: number; // 0-100%
  paymentHistory: PaymentRecord[];
  riskLevel: 'safe' | 'warning' | 'critical'; // based on days overdue, remaining amount
  recommendations: string[];
}

export interface PaymentRecord {
  date: string;
  amount: number;
  category: string;
  expense: string;
  status: string;
}

export interface AdvanceSummaryReport {
  totalGiven: number;
  totalReceived: number;
  activeAdvances: number;
  settledAdvances: number;
  totalOutstanding: number;
  totalInterestAccrued: number;
  averageSettlementTime: number; // days
  riskySituations: AdvanceAnalytics[];
  upcomingDue: AdvanceAnalytics[];
  cashFlowImpact: number; // net given - received
}

/**
 * Calculate interest on an advance (optional, configurable)
 * Default: 0% (no interest), but can be set to track late-payment interest
 */
export function calculateInterest(
  originalAmount: number,
  daysActive: number,
  dailyRate: number = 0 // Daily interest rate (0.01 = 1% per day)
): number {
  if (dailyRate <= 0) return 0;
  return Math.round(originalAmount * dailyRate * daysActive);
}

/**
 * Get payment history for an advance
 */
export function getPaymentHistory(advance: Advance, expenses: Expense[]): PaymentRecord[] {
  return expenses
    .filter(e => e.advanceId === advance.id && counted(e.status))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(e => ({
      date: e.date,
      amount: e.amount,
      category: e.category,
      expense: `${e.category} (${e.type})`,
      status: e.status,
    }));
}

/**
 * Calculate settlement progress as percentage
 */
export function getSettlementProgress(advance: Advance, expenses: Expense[]): number {
  if (advance.amount <= 0) return 100;
  const spent = expenses
    .filter(e => e.advanceId === advance.id && counted(e.status))
    .reduce((s, e) => s + e.amount, 0);
  return Math.round((spent / advance.amount) * 100);
}

/**
 * Determine risk level based on:
 * - Days since creation/last activity
 * - Remaining balance
 * - Settlement progress
 */
export function getRiskLevel(
  advance: Advance,
  daysActive: number,
  remaining: number,
  progress: number
): 'safe' | 'warning' | 'critical' {
  // Critical: overdue (30+ days), large remaining amount, slow progress
  if (daysActive > 30 && remaining > advance.amount * 0.5 && progress < 30) return 'critical';

  // Warning: moderately overdue (15+ days), significant remaining, or very old advance
  if ((daysActive > 15 && remaining > advance.amount * 0.3) || daysActive > 60) return 'warning';

  // Safe: on track or recently created
  return 'safe';
}

/**
 * Generate smart recommendations for an advance
 */
export function getAdvanceRecommendations(
  advance: Advance,
  spent: number,
  remaining: number,
  daysActive: number,
  progress: number
): string[] {
  const recommendations: string[] = [];

  if (advance.status !== 'active') {
    recommendations.push('Advance is settled - consider archiving');
    return recommendations;
  }

  if (daysActive > 60) {
    recommendations.push(`⚠️ This advance has been active for ${daysActive} days - consider settling soon`);
  }

  if (progress < 10 && daysActive > 7) {
    recommendations.push('No activity in this advance for a week - check if more payments needed');
  }

  if (progress > 90) {
    recommendations.push('✅ Almost settled! Just ' + Math.round(remaining) + ' remaining');
  }

  if (remaining > 0 && daysActive > 30) {
    const dailyRate = spent / daysActive;
    const daysToSettle = Math.ceil(remaining / dailyRate);
    if (daysToSettle > 30) {
      recommendations.push(`At current pace, this will take ~${daysToSettle} more days to settle`);
    }
  }

  const avgPayment = spent / Math.max(1, Math.floor(progress / 10)); // Rough estimate
  if (avgPayment > 10000) {
    recommendations.push('High transaction values - verify all payments are legitimate');
  }

  return recommendations;
}

/**
 * Comprehensive analytics for a single advance
 */
export function analyzeAdvance(
  advance: Advance,
  expenses: Expense[]
): AdvanceAnalytics {
  const now = new Date();
  const createdDate = new Date(advance.createdAt);
  const daysActive = differenceInDays(now, createdDate);

  const paymentHistory = getPaymentHistory(advance, expenses);
  const lastPayment = paymentHistory[0];
  const daysSinceLastActivity = lastPayment
    ? differenceInDays(now, new Date(lastPayment.date))
    : daysActive;

  const spent = expenses
    .filter(e => e.advanceId === advance.id && counted(e.status))
    .reduce((s, e) => s + e.amount, 0);
  const remaining = Math.max(0, advance.amount - spent);
  const returned = advance.returnedAmount || 0;
  const progress = getSettlementProgress(advance, expenses);
  const interestAccrued = calculateInterest(advance.amount, daysActive);
  const riskLevel = getRiskLevel(advance, daysActive, remaining, progress);
  const recommendations = getAdvanceRecommendations(advance, spent, remaining, daysActive, progress);

  return {
    id: advance.id,
    personName: advance.person,
    direction: advance.direction,
    originalAmount: advance.amount,
    spent,
    remaining,
    returned,
    status: advance.status,
    daysActive,
    daysSinceLastActivity,
    interestAccrued,
    totalWithInterest: advance.amount + interestAccrued,
    settlementProgress: progress,
    paymentHistory,
    riskLevel,
    recommendations,
  };
}

/**
 * Generate comprehensive advance report
 */
export function generateAdvancesReport(
  advances: Advance[],
  expenses: Expense[]
): AdvanceSummaryReport {
  const analyses = advances.map(a => analyzeAdvance(a, expenses));

  const givenAdvances = analyses.filter(a => a.direction === 'given');
  const receivedAdvances = analyses.filter(a => a.direction === 'received');

  const totalGiven = givenAdvances.reduce((s, a) => s + a.originalAmount, 0);
  const totalReceived = receivedAdvances.reduce((s, a) => s + a.originalAmount, 0);
  const activeAdvances = analyses.filter(a => a.status === 'active').length;
  const settledAdvances = analyses.filter(a => a.status === 'settled').length;

  const totalOutstanding = analyses.reduce((s, a) => s + a.remaining, 0);
  const totalInterestAccrued = analyses.reduce((s, a) => s + a.interestAccrued, 0);

  const completedAdvances = analyses.filter(a => a.status === 'settled' && a.daysActive > 0);
  const averageSettlementTime = completedAdvances.length > 0
    ? Math.round(completedAdvances.reduce((s, a) => s + a.daysActive, 0) / completedAdvances.length)
    : 0;

  const riskySituations = analyses
    .filter(a => a.riskLevel !== 'safe')
    .sort((a, b) => {
      if (a.riskLevel === 'critical' && b.riskLevel !== 'critical') return -1;
      if (a.riskLevel !== 'critical' && b.riskLevel === 'critical') return 1;
      return b.daysActive - a.daysActive;
    });

  const upcomingDue = analyses
    .filter(a => a.status === 'active' && a.remaining > 0 && a.daysActive > 15)
    .sort((a, b) => b.daysActive - a.daysActive)
    .slice(0, 5);

  const cashFlowImpact = totalGiven - totalReceived;

  return {
    totalGiven,
    totalReceived,
    activeAdvances,
    settledAdvances,
    totalOutstanding,
    totalInterestAccrued,
    averageSettlementTime,
    riskySituations,
    upcomingDue,
    cashFlowImpact,
  };
}

/**
 * Validate advance before creation
 */
export function validateAdvance(
  person: string,
  amount: number,
  direction: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!person || person.trim().length === 0) {
    errors.push('Person name is required');
  }

  if (amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (amount > 10000000) {
    errors.push('Amount seems unusually high - verify correct value');
  }

  if (!['given', 'received'].includes(direction)) {
    errors.push('Direction must be "given" or "received"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
