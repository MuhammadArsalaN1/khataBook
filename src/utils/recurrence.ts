import { RecurrenceRule, Expense, ExpenseStatus } from '../types';
import { addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';

/** Get the next due date based on recurrence frequency. */
export function getNextDueDate(rule: RecurrenceRule): Date {
  const current = new Date(rule.nextDueDate);
  const freq = rule.frequency;

  switch (freq) {
    case 'daily':
      return addDays(current, 1);
    case 'weekly':
      return addWeeks(current, 1);
    case 'biweekly':
      return addWeeks(current, 2);
    case 'monthly':
      // Use dayOfMonth if specified, else day-of-month from nextDueDate
      const day = rule.dayOfMonth ?? current.getDate();
      const nextMonth = addMonths(current, 1);
      const result = new Date(nextMonth);
      result.setDate(day);
      return result;
    case 'quarterly':
      return addQuarters(current, 1);
    case 'yearly':
      return addYears(current, 1);
    default:
      return current;
  }
}

/** Check if a recurrence rule is due today. */
export function isRecurrenceDue(rule: RecurrenceRule, checkDate: Date = new Date()): boolean {
  if (!rule.active) return false;
  if (rule.endDate && checkDate > new Date(rule.endDate)) return false;

  const nextDue = new Date(rule.nextDueDate);
  return checkDate.toDateString() === nextDue.toDateString();
}

/** Generate an expense from a recurrence rule. */
export function generateExpenseFromRule(
  rule: RecurrenceRule,
  userId: string,
  approvalRequired: boolean
): Expense {
  return {
    id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: rule.expenseTemplate.type,
    category: rule.expenseTemplate.category,
    amount: rule.expenseTemplate.amount,
    date: new Date().toISOString().split('T')[0],
    notes: rule.expenseTemplate.notes,
    paymentMethod: rule.expenseTemplate.paymentMethod,
    enteredBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: approvalRequired ? 'pending' : 'approved',
    isRecurring: true,
    tags: [`auto-generated-${rule.id}`],
  };
}

/** Recurrence rule detail with display info. */
export interface RecurrenceRuleWithDisplay extends RecurrenceRule {
  displayName: string;    // "Electricity Bill" (from template notes or category)
  daysUntilDue: number;   // How many days until next due date
  isOverdue: boolean;
}

export function withDisplay(rule: RecurrenceRule): RecurrenceRuleWithDisplay {
  const nextDue = new Date(rule.nextDueDate);
  const today = new Date();
  const daysUntil = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const displayName = rule.expenseTemplate.notes || rule.expenseTemplate.category;

  return {
    ...rule,
    displayName,
    daysUntilDue: daysUntil,
    isOverdue: daysUntil < 0,
  };
}
