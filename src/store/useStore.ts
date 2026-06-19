import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  subscribeExpenses, subscribeLogs, subscribeBudgets, subscribeIncomes, subscribeWallets, subscribeSavingsGoals, subscribeTemplates,
  addExpenseDoc, updateExpenseDoc, deleteExpenseDoc,
  addLogDoc, upsertBudgetDoc, upsertIncomeDoc, upsertWalletDoc, deleteWalletDoc, upsertSavingsGoalDoc, deleteSavingsGoalDoc, upsertTemplateDoc, deleteTemplateDoc, saveSettings, getSettings,
  subscribeAdvances, upsertAdvanceDoc, deleteAdvanceDoc,
  subscribeBudgetPools, upsertBudgetPoolDoc, deleteBudgetPoolDoc,
  subscribeRecurrenceRules, upsertRecurrenceRuleDoc, deleteRecurrenceRuleDoc, updateRecurrenceRuleDoc,
  subscribeAdvanceBalanceEntries, upsertAdvanceBalanceEntry, updateAdvanceBalanceEntry, deleteAdvanceBalanceEntry as deleteAdvanceBalanceEntryDoc,
} from '../database/storage';
import { Expense, ActivityLog, Budget, User, ExpenseType, Wallet, SavingsGoal, ExpenseTemplate, Currency, Advance, BudgetPool, RecurrenceRule, Theme, AdvanceBalanceEntry } from '../types';
import { USERS, DEFAULT_EXCHANGE_RATES } from '../constants';
import { ExchangeRates } from '../utils/currency';
import { saveCredentials, getCredentials, clearCredentials, promptBiometric } from '../utils/biometric';

// ── Global state ─────────────────────────────────────────────────────────────
interface AppState {
  expenses: Expense[];
  activityLogs: ActivityLog[];
  budgets: Budget[];
  budgetPools: BudgetPool[];
  incomes: any[];
  wallets: Wallet[];
  savingsGoals: SavingsGoal[];
  templates: ExpenseTemplate[];
  advances: Advance[];
  advanceBalanceEntries: AdvanceBalanceEntry[];
  recurrenceRules: RecurrenceRule[];
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  approvalMode: boolean;
  exchangeRates: ExchangeRates;
  theme: Theme;
  authLoading: boolean;
  dataLoading: boolean;
  authError: string | null;
}

let state: AppState = {
  expenses: [],
  activityLogs: [],
  budgets: [],
  budgetPools: [],
  incomes: [],
  wallets: [],
  savingsGoals: [],
  templates: [],
  advances: [],
  advanceBalanceEntries: [],
  recurrenceRules: [],
  currentUser: null,
  firebaseUser: null,
  approvalMode: false,
  exchangeRates: { ...DEFAULT_EXCHANGE_RATES },
  theme: 'light',
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
let unsubSavingsGoals: (() => void) | null = null;
let unsubTemplates: (() => void) | null = null;
let unsubAdvances: (() => void) | null = null;
let unsubAdvanceBalanceEntries: (() => void) | null = null;
let unsubBudgetPools: (() => void) | null = null;
let unsubRecurrenceRules: (() => void) | null = null;

function startListeners() {
  console.log('🔄 Starting Firestore listeners...');
  unsubExpenses = subscribeExpenses(
    expenses => {
      console.log(`✅ Synced ${expenses.length} expenses`);
      setState({ expenses, dataLoading: false });
    },
    err => console.error('❌ Expenses sync error:', err)
  );
  unsubLogs = subscribeLogs(
    activityLogs => {
      console.log(`✅ Synced ${activityLogs.length} activity logs`);
      setState({ activityLogs });
    },
    err => console.error('❌ Logs sync error:', err)
  );
  unsubBudgets = subscribeBudgets(
    budgets => {
      console.log(`✅ Synced ${budgets.length} budgets`);
      setState({ budgets });
    },
    err => console.error('❌ Budgets sync error:', err)
  );
  unsubIncomes = subscribeIncomes(
    incomes => {
      console.log(`✅ Synced ${incomes.length} incomes`);
      setState({ incomes });
    },
    err => console.error('❌ Incomes sync error:', err)
  );
  unsubWallets = subscribeWallets(
    wallets => {
      console.log(`✅ Synced ${wallets.length} wallets`);
      setState({ wallets });
    },
    err => console.error('❌ Wallets sync error:', err)
  );
  unsubSavingsGoals = subscribeSavingsGoals(
    savingsGoals => {
      console.log(`✅ Synced ${savingsGoals.length} savings goals`);
      setState({ savingsGoals });
    },
    err => console.error('❌ Savings goals sync error:', err)
  );
  unsubTemplates = subscribeTemplates(
    templates => {
      console.log(`✅ Synced ${templates.length} templates`);
      setState({ templates });
    },
    err => console.error('❌ Templates sync error:', err)
  );
  unsubAdvances = subscribeAdvances(
    advances => {
      console.log(`✅ Synced ${advances.length} advances`);
      setState({ advances });
    },
    err => console.error('❌ Advances sync error:', err)
  );
  unsubAdvanceBalanceEntries = subscribeAdvanceBalanceEntries(
    advanceBalanceEntries => {
      console.log(`✅ Synced ${advanceBalanceEntries.length} advance balance entries`);
      setState({ advanceBalanceEntries });
    },
    err => console.error('❌ Advance balance entries sync error:', err)
  );
  unsubBudgetPools = subscribeBudgetPools(
    budgetPools => {
      console.log(`✅ Synced ${budgetPools.length} budget pools`);
      setState({ budgetPools });
    },
    err => console.error('❌ Budget pools sync error:', err)
  );
  unsubRecurrenceRules = subscribeRecurrenceRules(
    recurrenceRules => {
      console.log(`✅ Synced ${recurrenceRules.length} recurrence rules`);
      setState({ recurrenceRules });
    },
    err => console.error('❌ Recurrence rules sync error:', err)
  );
}

function stopListeners() {
  unsubExpenses?.(); unsubExpenses = null;
  unsubLogs?.();     unsubLogs = null;
  unsubBudgets?.();  unsubBudgets = null;
  unsubIncomes?.();  unsubIncomes = null;
  unsubWallets?.();  unsubWallets = null;
  unsubSavingsGoals?.(); unsubSavingsGoals = null;
  unsubTemplates?.(); unsubTemplates = null;
  unsubAdvances?.(); unsubAdvances = null;
  unsubAdvanceBalanceEntries?.(); unsubAdvanceBalanceEntries = null;
  unsubBudgetPools?.(); unsubBudgetPools = null;
  unsubRecurrenceRules?.(); unsubRecurrenceRules = null;
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
      exchangeRates: { ...DEFAULT_EXCHANGE_RATES, ...(settings.exchangeRates as Partial<ExchangeRates> ?? {}) },
      theme: (settings.theme as Theme) || 'light',
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
      budgetPools: [],
      wallets: [],
      savingsGoals: [],
      templates: [],
      advances: [],
      advanceBalanceEntries: [],
      recurrenceRules: [],
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
      // remember credentials so the user can unlock with biometrics next time
      const appUser = USERS.find(u => u.email === email);
      await saveCredentials(email, password, appUser?.name);
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
    await clearCredentials();
    await signOut(auth);
  }, []);

  // Unlock with fingerprint/Face ID using the last saved credentials.
  const biometricLogin = useCallback(async (): Promise<boolean> => {
    const creds = await getCredentials();
    if (!creds) return false;
    const ok = await promptBiometric('Unlock Khata Book');
    if (!ok) return false;
    setState({ authError: null, authLoading: true });
    try {
      await signInWithEmailAndPassword(auth, creds.email, creds.password);
      return true;
    } catch {
      setState({ authError: 'Biometric login failed — please sign in with your password.', authLoading: false });
      await clearCredentials();
      return false;
    }
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
    const isUser = state.currentUser?.role !== 'admin';
    const status = state.approvalMode && isUser ? 'pending' : 'approved';
    await upsertIncomeDoc({
      id, type, amount, month, year,
      status, enteredBy: state.currentUser?.id ?? '',
      createdAt: new Date().toISOString(),
    });
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: 'add',
      expenseId: id,
      details: `Set ${type} income: Rs. ${amount.toLocaleString()}${status === 'pending' ? ' (pending approval)' : ''}`,
    });
  }, []);

  const approveIncome = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    const inc = state.incomes.find((i: any) => i.id === id);
    if (!inc) return;
    await upsertIncomeDoc({ ...inc, status });
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: status === 'approved' ? 'approve' : 'reject',
      expenseId: id,
      details: `Income ${status}: ${inc.type} Rs. ${inc.amount?.toLocaleString?.() ?? inc.amount}`,
    });
  }, []);

  // ── Settings ──────────────────────────────────────────────────────────────
  const toggleApprovalMode = useCallback(async () => {
    const next = !state.approvalMode;
    setState({ approvalMode: next });
    await saveSettings({ approvalMode: next });
  }, []);

  const saveExchangeRates = useCallback(async (rates: ExchangeRates) => {
    setState({ exchangeRates: rates });
    await saveSettings({ exchangeRates: rates });
  }, []);

  // ── Wallets ───────────────────────────────────────────────────────────────
  const saveWallet = useCallback(async (wallet: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `wlt_${wallet.userId}_${wallet.provider}_${wallet.agency}_${wallet.currency}_${wallet.month}_${wallet.year}`;
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

  // ── Savings Goals ────────────────────────────────────────────────────────────
  const saveSavingsGoal = useCallback(async (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    const goalDoc: SavingsGoal = { ...goal, id, createdAt: now, updatedAt: now };
    await upsertSavingsGoalDoc(goalDoc);
  }, []);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    await deleteSavingsGoalDoc(id);
  }, []);

  // ── Expense Templates ────────────────────────────────────────────────────────
  const saveTemplate = useCallback(async (template: Omit<ExpenseTemplate, 'id' | 'createdAt'>) => {
    const id = `tpl_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const templateDoc: ExpenseTemplate = { ...template, id, createdAt: new Date().toISOString() };
    await upsertTemplateDoc(templateDoc);
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    await deleteTemplateDoc(id);
  }, []);

  // ── Advances / Funds ─────────────────────────────────────────────────────────
  const saveAdvance = useCallback(async (data: { direction: Advance['direction']; person: string; amount: number; date: string; notes?: string }) => {
    const id = `adv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    const doc: Advance = {
      id, direction: data.direction, person: data.person.trim(), amount: data.amount,
      date: data.date, notes: data.notes ?? '', status: 'active', returnedAmount: 0,
      createdBy: state.currentUser?.id ?? '', createdAt: now, updatedAt: now,
    };
    await upsertAdvanceDoc(doc);
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: 'add',
      expenseId: id,
      details: data.direction === 'given'
        ? `Gave advance of Rs. ${data.amount.toLocaleString()} to ${doc.person}`
        : `Received advance of Rs. ${data.amount.toLocaleString()} from ${doc.person}`,
    });
  }, []);

  // Settle an advance. returnedAmount = cash moved back to Main (0 for "mark consumed").
  const settleAdvance = useCallback(async (id: string, returnedAmount: number) => {
    const adv = state.advances.find(a => a.id === id);
    if (!adv) return;
    await upsertAdvanceDoc({ ...adv, status: 'settled', returnedAmount, updatedAt: new Date().toISOString() });
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: 'edit',
      expenseId: id,
      details: `Settled ${adv.direction} advance with ${adv.person}${returnedAmount > 0 ? ` (Rs. ${returnedAmount.toLocaleString()} returned)` : ''}`,
    });
  }, []);

  const reopenAdvance = useCallback(async (id: string) => {
    const adv = state.advances.find(a => a.id === id);
    if (!adv) return;
    await upsertAdvanceDoc({ ...adv, status: 'active', returnedAmount: 0, updatedAt: new Date().toISOString() });
  }, []);

  const deleteAdvance = useCallback(async (id: string) => {
    await deleteAdvanceDoc(id);
  }, []);

  // ── Budget Pools ──────────────────────────────────────────────────────────────
  const saveBudgetPool = useCallback(async (data: Omit<BudgetPool, 'id' | 'spent' | 'remaining' | 'createdAt' | 'updatedAt'>) => {
    const id = `pool_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    const pool: BudgetPool = {
      ...data,
      id,
      spent: 0,
      remaining: data.allocatedAmount,
      createdAt: now,
      updatedAt: now,
    };
    await upsertBudgetPoolDoc(pool);
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: 'add',
      expenseId: id,
      details: `Created budget pool "${data.name}" with Rs. ${data.allocatedAmount.toLocaleString()} allocation`,
    });
    return pool;
  }, []);

  const updateBudgetPool = useCallback(async (id: string, updates: Partial<BudgetPool>) => {
    const pool = state.budgetPools.find(p => p.id === id);
    if (!pool) return;
    const updated = { ...pool, ...updates, updatedAt: new Date().toISOString() };
    await upsertBudgetPoolDoc(updated);
  }, []);

  const deleteBudgetPool = useCallback(async (id: string) => {
    await deleteBudgetPoolDoc(id);
  }, []);

  // ── Recurrence Rules ──────────────────────────────────────────────────────────
  const createRecurrenceRule = useCallback(async (data: Omit<RecurrenceRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `recur_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    const rule: RecurrenceRule = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await upsertRecurrenceRuleDoc(rule);
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: 'add',
      expenseId: id,
      details: `Created recurring expense: ${data.expenseTemplate.category} (${data.frequency})`,
    });
    return rule;
  }, []);

  const updateRecurrenceRule = useCallback(async (id: string, updates: Partial<RecurrenceRule>) => {
    const rule = state.recurrenceRules.find(r => r.id === id);
    if (!rule) return;
    const updated = { ...rule, ...updates, updatedAt: new Date().toISOString() };
    await updateRecurrenceRuleDoc(id, updated);
  }, []);

  const deleteRecurrenceRule = useCallback(async (id: string) => {
    await deleteRecurrenceRuleDoc(id);
  }, []);

  // ── Advance Balance Entries ───────────────────────────────────────────────────
  const createAdvanceBalanceEntry = useCallback(async (entry: Omit<AdvanceBalanceEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `adv_bal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    const newEntry: AdvanceBalanceEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await upsertAdvanceBalanceEntry(newEntry);
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: 'add',
      expenseId: id,
      details: entry.direction === 'given'
        ? `Gave advance of Rs. ${entry.amount.toLocaleString()} to ${entry.receiverName}`
        : `Received advance of Rs. ${entry.amount.toLocaleString()} from ${entry.giverName}`,
    });
    return newEntry;
  }, []);

  const recordAdvanceReturn = useCallback(async (id: string, amount: number, method: string, notes?: string) => {
    const entry = state.advanceBalanceEntries.find(e => e.id === id);
    if (!entry) throw new Error('Advance entry not found');

    const totalReturned = entry.returnedAmount + amount;
    if (totalReturned > entry.amount) {
      throw new Error(`Cannot return more than original amount (${entry.amount}). Already returned: ${entry.returnedAmount}`);
    }

    const newReturn = {
      id: `ret_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      method,
      notes,
      recordedBy: state.currentUser?.id ?? '',
      createdAt: new Date().toISOString(),
    };

    const updatedEntry: AdvanceBalanceEntry = {
      ...entry,
      returnedAmount: totalReturned,
      pendingAmount: entry.amount - totalReturned,
      returnHistory: [...(entry.returnHistory || []), newReturn],
      status: totalReturned === entry.amount ? 'settled' : 'active',
      updatedAt: new Date().toISOString(),
    };

    await updateAdvanceBalanceEntry(id, updatedEntry);
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: 'edit',
      expenseId: id,
      details: `Recorded advance return of Rs. ${amount.toLocaleString()} via ${method}`,
    });
    return updatedEntry;
  }, []);

  const deleteAdvanceBalanceEntry = useCallback(async (id: string) => {
    await deleteAdvanceBalanceEntryDoc(id);
    logActivity({
      userId: state.currentUser?.id ?? '',
      userName: state.currentUser?.name ?? '',
      action: 'delete',
      expenseId: id,
      details: 'Deleted advance balance entry',
    });
  }, []);

  // ── Sync ───────────────────────────────────────────────────────────────────────
  const syncData = useCallback(async () => {
    console.log('🔄 Manual sync triggered...');
    setState({ dataLoading: true });
    try {
      stopListeners();
      setTimeout(() => {
        startListeners();
        setState({ dataLoading: false });
      }, 500);
    } catch (err) {
      console.error('Sync error:', err);
      setState({ dataLoading: false });
    }
  }, []);

  // ── Theme ─────────────────────────────────────────────────────────────────────
  const toggleTheme = useCallback(async () => {
    const newTheme: Theme = state.theme === 'light' ? 'dark' : 'light';
    setState({ theme: newTheme });
    await saveSettings({ ...state, theme: newTheme });
  }, []);

  return {
    ...state,
    loading: state.authLoading || state.dataLoading,
    login,
    logout,
    biometricLogin,
    addExpense,
    editExpense,
    deleteExpense,
    approveExpense,
    saveBudget,
    saveIncome,
    approveIncome,
    toggleApprovalMode,
    saveExchangeRates,
    saveWallet,
    deleteWallet,
    saveSavingsGoal,
    deleteSavingsGoal,
    saveTemplate,
    deleteTemplate,
    saveAdvance,
    settleAdvance,
    reopenAdvance,
    deleteAdvance,
    createAdvanceBalanceEntry,
    recordAdvanceReturn,
    deleteAdvanceBalanceEntry,
    saveBudgetPool,
    updateBudgetPool,
    deleteBudgetPool,
    createRecurrenceRule,
    updateRecurrenceRule,
    deleteRecurrenceRule,
    syncData,
    toggleTheme,
  };
}
