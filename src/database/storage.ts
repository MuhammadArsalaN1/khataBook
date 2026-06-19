// Firestore-backed storage — replaces the old AsyncStorage implementation.
// All reads/writes go through the Firestore collections below.
// Real-time sync is handled in useStore via onSnapshot listeners.

import {
  collection, doc, setDoc, deleteDoc, getDocs,
  onSnapshot, query, orderBy, Unsubscribe, updateDoc,
  serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Expense, ActivityLog, Budget, Wallet, SavingsGoal, ExpenseTemplate, Advance, BudgetPool, RecurrenceRule, AdvanceBalanceEntry } from '../types';

// ── Collection refs ──────────────────────────────────────────────────────────
export const expensesCol = () => collection(db, 'expenses');
export const logsCol = () => collection(db, 'activityLogs');
export const budgetsCol = () => collection(db, 'budgets');
export const settingsDoc = () => doc(db, 'settings', 'global');

// ── Expenses ─────────────────────────────────────────────────────────────────
export const addExpenseDoc = (expense: Expense) =>
  setDoc(doc(db, 'expenses', expense.id), expense);

export const updateExpenseDoc = (id: string, updates: Partial<Expense>) =>
  updateDoc(doc(db, 'expenses', id), { ...updates, updatedAt: new Date().toISOString() });

export const deleteExpenseDoc = (id: string) =>
  deleteDoc(doc(db, 'expenses', id));

// ── Activity Logs ─────────────────────────────────────────────────────────────
export const addLogDoc = (log: ActivityLog) =>
  setDoc(doc(db, 'activityLogs', log.id), log);

// ── Budgets ───────────────────────────────────────────────────────────────────
export const upsertBudgetDoc = (budget: Budget) =>
  setDoc(doc(db, 'budgets', budget.id), budget);

// ── Settings ──────────────────────────────────────────────────────────────────
export const saveSettings = (data: Record<string, unknown>) =>
  setDoc(settingsDoc(), data, { merge: true });

export const getSettings = async (): Promise<Record<string, unknown>> => {
  try {
    const snap = await getDoc(settingsDoc());
    return snap.exists() ? (snap.data() as Record<string, unknown>) : {};
  } catch (err) {
    console.error('Failed to fetch settings:', err);
    return {};
  }
};

// ── Real-time listeners with error handling ─────────────────────────────────
export const subscribeExpenses = (cb: (data: Expense[]) => void, onError?: (err: any) => void): Unsubscribe =>
  onSnapshot(
    query(expensesCol(), orderBy('createdAt', 'desc')),
    snap => cb(snap.docs.map(d => d.data() as Expense)),
    err => { console.error('Expenses listener error:', err); onError?.(err); }
  );

export const subscribeLogs = (cb: (data: ActivityLog[]) => void, onError?: (err: any) => void): Unsubscribe =>
  onSnapshot(
    query(logsCol(), orderBy('timestamp', 'desc')),
    snap => cb(snap.docs.map(d => d.data() as ActivityLog)),
    err => { console.error('Logs listener error:', err); onError?.(err); }
  );

export const subscribeBudgets = (cb: (data: Budget[]) => void, onError?: (err: any) => void): Unsubscribe =>
  onSnapshot(
    budgetsCol(),
    snap => cb(snap.docs.map(d => d.data() as Budget)),
    err => { console.error('Budgets listener error:', err); onError?.(err); }
  );

// ── Income ────────────────────────────────────────────────────────────────
export const incomesCol = () => collection(db, 'incomes');

export const upsertIncomeDoc = (income: any) =>
  setDoc(doc(db, 'incomes', income.id), income);

export const subscribeIncomes = (cb: (data: any[]) => void, onError?: (err: any) => void): Unsubscribe =>
  onSnapshot(
    incomesCol(),
    snap => cb(snap.docs.map(d => d.data())),
    err => { console.error('Incomes listener error:', err); onError?.(err); }
  );

// ── Wallets ───────────────────────────────────────────────────────────────
export const walletsCol = () => collection(db, 'wallets');

export const upsertWalletDoc = (wallet: Wallet) =>
  setDoc(doc(db, 'wallets', wallet.id), wallet);

export const deleteWalletDoc = (id: string) =>
  deleteDoc(doc(db, 'wallets', id));

export const subscribeWallets = (cb: (data: Wallet[]) => void, onError?: (err: any) => void): Unsubscribe =>
  onSnapshot(
    walletsCol(),
    snap => cb(snap.docs.map(d => d.data() as Wallet)),
    err => { console.error('Wallets listener error:', err); onError?.(err); }
  );

// ── Savings Goals ────────────────────────────────────────────────────────────
export const savingsGoalsCol = () => collection(db, 'savingsGoals');

export const upsertSavingsGoalDoc = (goal: SavingsGoal) =>
  setDoc(doc(db, 'savingsGoals', goal.id), goal);

export const deleteSavingsGoalDoc = (id: string) =>
  deleteDoc(doc(db, 'savingsGoals', id));

export const subscribeSavingsGoals = (cb: (data: SavingsGoal[]) => void, onError?: (err: any) => void): Unsubscribe =>
  onSnapshot(
    savingsGoalsCol(),
    snap => cb(snap.docs.map(d => d.data() as SavingsGoal)),
    err => { console.error('Savings goals listener error:', err); onError?.(err); }
  );

// ── Expense Templates ────────────────────────────────────────────────────────
export const templatesCol = () => collection(db, 'expenseTemplates');

export const upsertTemplateDoc = (template: ExpenseTemplate) =>
  setDoc(doc(db, 'expenseTemplates', template.id), template);

export const deleteTemplateDoc = (id: string) =>
  deleteDoc(doc(db, 'expenseTemplates', id));

export const subscribeTemplates = (cb: (data: ExpenseTemplate[]) => void, onError?: (err: any) => void): Unsubscribe =>
  onSnapshot(
    templatesCol(),
    snap => cb(snap.docs.map(d => d.data() as ExpenseTemplate)),
    err => { console.error('Templates listener error:', err); onError?.(err); }
  );

// ── Advances (float given to a person, spent against) ─────────────────────────
export const advancesCol = () => collection(db, 'advances');

export const upsertAdvanceDoc = (advance: Advance) =>
  setDoc(doc(db, 'advances', advance.id), advance);

export const deleteAdvanceDoc = (id: string) =>
  deleteDoc(doc(db, 'advances', id));

export const subscribeAdvances = (cb: (data: Advance[]) => void, onError?: (err: any) => void): Unsubscribe =>
  onSnapshot(
    advancesCol(),
    snap => cb(snap.docs.map(d => d.data() as Advance)),
    err => { console.error('Advances listener error:', err); onError?.(err); }
  );

// ── Budget Pools (allocated spending categories like Diesel, Labor, Maintenance) ──
export const budgetPoolsCol = () => collection(db, 'budgetPools');

export const upsertBudgetPoolDoc = (pool: BudgetPool) =>
  setDoc(doc(db, 'budgetPools', pool.id), pool);

export const deleteBudgetPoolDoc = (id: string) =>
  deleteDoc(doc(db, 'budgetPools', id));

export const subscribeBudgetPools = (cb: (data: BudgetPool[]) => void, onError?: (err: any) => void): Unsubscribe =>
  onSnapshot(
    budgetPoolsCol(),
    snap => cb(snap.docs.map(d => d.data() as BudgetPool)),
    err => { console.error('Budget pools listener error:', err); onError?.(err); }
  );

// ── Recurrence Rules (for automating recurring expenses) ──
export const recurrenceRulesCol = () => collection(db, 'recurrenceRules');

export const upsertRecurrenceRuleDoc = (rule: RecurrenceRule) =>
  setDoc(doc(db, 'recurrenceRules', rule.id), rule);

export const deleteRecurrenceRuleDoc = (id: string) =>
  deleteDoc(doc(db, 'recurrenceRules', id));

export const updateRecurrenceRuleDoc = (id: string, updates: Partial<RecurrenceRule>) =>
  updateDoc(doc(db, 'recurrenceRules', id), { ...updates, updatedAt: new Date().toISOString() });

export const subscribeRecurrenceRules = (cb: (data: RecurrenceRule[]) => void, onError?: (err: any) => void): Unsubscribe =>
  onSnapshot(
    recurrenceRulesCol(),
    snap => cb(snap.docs.map(d => d.data() as RecurrenceRule)),
    err => { console.error('Recurrence rules listener error:', err); onError?.(err); }
  );

// ── Advance Balance Entries (NEW FEATURE: Fund transfers between users) ──────────────────────────────────────────
export const advanceBalanceEntriesCol = () => collection(db, 'advanceBalanceEntries');

export const upsertAdvanceBalanceEntry = (entry: AdvanceBalanceEntry) =>
  setDoc(doc(db, 'advanceBalanceEntries', entry.id), entry);

export const deleteAdvanceBalanceEntry = (id: string) =>
  deleteDoc(doc(db, 'advanceBalanceEntries', id));

export const updateAdvanceBalanceEntry = (id: string, updates: Partial<AdvanceBalanceEntry>) =>
  updateDoc(doc(db, 'advanceBalanceEntries', id), { ...updates, updatedAt: new Date().toISOString() });

export const subscribeAdvanceBalanceEntries = (cb: (data: AdvanceBalanceEntry[]) => void, onError?: (err: any) => void): Unsubscribe =>
  onSnapshot(
    query(advanceBalanceEntriesCol(), orderBy('transactionDate', 'desc')),
    snap => cb(snap.docs.map(d => d.data() as AdvanceBalanceEntry)),
    err => { console.error('Advance balance entries listener error:', err); onError?.(err); }
  );
