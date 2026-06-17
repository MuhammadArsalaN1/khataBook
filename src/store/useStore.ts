import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  subscribeExpenses, subscribeLogs, subscribeBudgets, subscribeIncomes, subscribeWallets,
  addExpenseDoc, updateExpenseDoc, deleteExpenseDoc,
  addLogDoc, upsertBudgetDoc, upsertIncomeDoc, upsertWalletDoc, deleteWalletDoc, saveSettings, getSettings,
} from '../database/storage';
import { Expense, ActivityLog, Budget, User, ExpenseType, Wallet } from '../types';
import { USERS } from '../constants';

// ── Global state ─────────────────────────────────────────────────────────────
interface AppState {
  expenses: Expense[];
  activityLogs: ActivityLog[];
  budgets: Budget[];
  incomes: any[];
  wallets: Wallet[];
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  approvalMode: boolean;
  authLoading: boolean;
  dataLoading: boolean;
  authError: string | null;
}

let state: AppState = {
  expenses: [],
  activityLogs: [],
  budgets: [],
  incomes: [],
  wallets: [],
  currentUser: null,
  firebaseUser: null,
  approvalMode: false,
  authLoading: true,
  dataLoading: true,
  authError: null,
};

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach(l => l());
const setState = (patch: Partial<AppState>) => { state = { ...state, ...patch }; notify(); };

// ── Firestore unsubscribe handles ─────────────────────────────────────────────
let unsubExpenses: (() => void) | null = null;
let unsubLogs: (() => void) | null = null;
let unsubBudgets: (() => void) | null = null;
let unsubIncomes: (() => void) | null = null;
let unsubWallets: (() => void) | null = null;

function startListeners() {
  unsubExpenses = subscribeExpenses(expenses => setState({ expenses, dataLoading: false }));
  unsubLogs = subscribeLogs(activityLogs => setState({ activityLogs }));
  unsubBudgets = subscribeBudgets(budgets => setState({ budgets }));
  unsubIncomes = subscribeIncomes(incomes => setState({ incomes }));
  unsubWallets = subscribeWallets(wallets => setState({ wallets }));
}

function stopListeners() {
  unsubExpenses?.(); unsubExpenses = null;
  unsubLogs?.();     unsubLogs = null;
  unsubBudgets?.();  unsubBudgets = null;
  unsubIncomes?.();  unsubIncomes = null;
  unsubWallets?.();  unsubWallets = null;
}

// ── Firebase Auth observer ────────────────────────────────────────────────────
onAuthStateChanged(auth, async (fbUser) => {
  if (fbUser) {
    const appUser = USERS.find(u => u.email === fbUser.email) ?? null;
    const settings = await getSettings();
    setState({
      firebaseUser: fbUser,
      currentUser: appUser,
      approvalMode: settings.approvalMode === true,
      authLoading: false,
      dataLoading: true,
      authError: null,
    });
    startListeners();
  } else {
    stopListeners();
    setState({
      firebaseUser: null,
      currentUser: null,
      expenses: [],
      activityLogs: [],
      budgets: [],
      wallets: [],
      authLoading: false,
      dataLoading: false,
      authError: null,
    });
  }
});

// ── Activity log helper ───────────────────────────────────────────────────────
function logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
  const entry: ActivityLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
  };
  addLogDoc(entry);
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useStore() {
  const [, tick] = useState(0);

  useEffect(() => {
    const l = () => tick(t => t + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setState({ authError: null, authLoading: true });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      const msg =
        e.code === 'auth/invalid-credential' ? 'Invalid email or password.' :
        e.code === 'auth/user-not-found'     ? 'No account found with this email.' :
        e.code === 'auth/wrong-password'     ? 'Incorrect password.' :
        e.code === 'auth/too-many-requests'  ? 'Too many attempts. Try again later.' :
        'Login failed. Check your connection.';
      setState({ authError: msg, authLoading: false });
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  // ── Expenses ──────────────────────────────────────────────────────────────
  const addExpense = useCallback(async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const expense: Expense = {
      ...data,
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await addExpenseDoc(expense);
    logActivity({
      userId: data.enteredBy,
      userName: state.currentUser?.name ?? '',
      action: 'add',
      expenseId: expense.id,
      details: `Added ${data.type} expense: ${data.category} — Rs. ${data.amount}`,
    });
    return expense;
  }, []);

  const editExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    await updateExpenseDoc(id, updates);
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: 'edit',
      expenseId: id,
      details: `Edited expense`,
    });
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const expense = state.expenses.find(e => e.id === id);
    await deleteExpenseDoc(id);
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: 'delete',
      expenseId: id,
      details: `Deleted: ${expense?.category ?? ''} — Rs. ${expense?.amount ?? ''}`,
    });
  }, []);

  const approveExpense = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    await updateExpenseDoc(id, { status });
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: status === 'approved' ? 'approve' : 'reject',
      expenseId: id,
      details: `Expense ${status}`,
    });
  }, []);

  // ── Budgets ───────────────────────────────────────────────────────────────
  const saveBudget = useCallback(async (budget: Omit<Budget, 'id'>) => {
    const id = `bgt_${budget.type}_${budget.month}_${budget.year}`;
    await upsertBudgetDoc({ ...budget, id });
  }, []);

  // ── Income ────────────────────────────────────────────────────────────────
  const saveIncome = useCallback(async (type: ExpenseType, amount: number, month: number, year: number) => {
    const id = `inc_${type}_${month}_${year}`;
    await upsertIncomeDoc({ id, type, amount, month, year, createdAt: new Date().toISOString() });
  }, []);

  // ── Settings ──────────────────────────────────────────────────────────────
  const toggleApprovalMode = useCallback(async () => {
    const next = !state.approvalMode;
    setState({ approvalMode: next });
    await saveSettings({ approvalMode: next });
  }, []);

  // ── Wallets ───────────────────────────────────────────────────────────────
  const saveWallet = useCallback(async (wallet: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `wlt_${wallet.userId}_${wallet.provider}_${wallet.month}_${wallet.year}`;
    const now = new Date().toISOString();
    const existing = state.wallets.find(w => w.id === id);
    const walletDoc: Wallet = {
      ...wallet,
      id,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await upsertWalletDoc(walletDoc);
  }, []);

  const deleteWallet = useCallback(async (id: string) => {
    await deleteWalletDoc(id);
  }, []);

  return {
    ...state,
    loading: state.authLoading || state.dataLoading,
    login,
    logout,
    addExpense,
    editExpense,
    deleteExpense,
    approveExpense,
    saveBudget,
    saveIncome,
    toggleApprovalMode,
    saveWallet,
    deleteWallet,
  };
}
