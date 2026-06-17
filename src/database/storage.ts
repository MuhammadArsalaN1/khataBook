// Firestore-backed storage — replaces the old AsyncStorage implementation.
// All reads/writes go through the Firestore collections below.
// Real-time sync is handled in useStore via onSnapshot listeners.

import {
  collection, doc, setDoc, deleteDoc, getDocs,
  onSnapshot, query, orderBy, Unsubscribe, updateDoc,
  serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Expense, ActivityLog, Budget, Wallet } from '../types';

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
  const snap = await getDoc(settingsDoc());
  return snap.exists() ? (snap.data() as Record<string, unknown>) : {};
};

// ── Real-time listeners ───────────────────────────────────────────────────────
export const subscribeExpenses = (cb: (data: Expense[]) => void): Unsubscribe =>
  onSnapshot(query(expensesCol(), orderBy('createdAt', 'desc')), snap =>
    cb(snap.docs.map(d => d.data() as Expense))
  );

export const subscribeLogs = (cb: (data: ActivityLog[]) => void): Unsubscribe =>
  onSnapshot(query(logsCol(), orderBy('timestamp', 'desc')), snap =>
    cb(snap.docs.map(d => d.data() as ActivityLog))
  );

export const subscribeBudgets = (cb: (data: Budget[]) => void): Unsubscribe =>
  onSnapshot(budgetsCol(), snap =>
    cb(snap.docs.map(d => d.data() as Budget))
  );

// ── Income ────────────────────────────────────────────────────────────────
export const incomesCol = () => collection(db, 'incomes');

export const upsertIncomeDoc = (income: any) =>
  setDoc(doc(db, 'incomes', income.id), income);

export const subscribeIncomes = (cb: (data: any[]) => void): Unsubscribe =>
  onSnapshot(incomesCol(), snap =>
    cb(snap.docs.map(d => d.data()))
  );

// ── Wallets ───────────────────────────────────────────────────────────────
export const walletsCol = () => collection(db, 'wallets');

export const upsertWalletDoc = (wallet: Wallet) =>
  setDoc(doc(db, 'wallets', wallet.id), wallet);

export const deleteWalletDoc = (id: string) =>
  deleteDoc(doc(db, 'wallets', id));

export const subscribeWallets = (cb: (data: Wallet[]) => void): Unsubscribe =>
  onSnapshot(walletsCol(), snap =>
    cb(snap.docs.map(d => d.data() as Wallet))
  );
