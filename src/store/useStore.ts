import { useState, useEffect, useCallback } from 'react';
import { Expense, ActivityLog, Budget, User, ExpenseType, ExpenseStatus, ActionType } from '../types';
import * as storage from '../database/storage';
import { format } from 'date-fns';

let globalState: AppState = {
  expenses: [],
  activityLogs: [],
  budgets: [],
  currentUser: null,
  approvalMode: false,
  loading: true,
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach(l => l());
}

interface AppState {
  expenses: Expense[];
  activityLogs: ActivityLog[];
  budgets: Budget[];
  currentUser: User | null;
  approvalMode: boolean;
  loading: boolean;
}

async function loadAll() {
  const [expenses, activityLogs, budgets, currentUser, approvalMode] = await Promise.all([
    storage.getExpenses(),
    storage.getActivityLogs(),
    storage.getBudgets(),
    storage.getCurrentUser(),
    storage.getApprovalMode(),
  ]);
  globalState = { expenses, activityLogs, budgets, currentUser, approvalMode, loading: false };
  notify();
}

loadAll();

function logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
  const entry: ActivityLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toISOString(),
  };
  globalState.activityLogs = [entry, ...globalState.activityLogs];
  storage.saveActivityLogs(globalState.activityLogs);
}

export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const login = useCallback(async (user: User) => {
    globalState = { ...globalState, currentUser: user };
    await storage.setCurrentUser(user);
    notify();
  }, []);

  const logout = useCallback(async () => {
    globalState = { ...globalState, currentUser: null };
    await storage.setCurrentUser(null);
    notify();
  }, []);

  const addExpense = useCallback(async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const expense: Expense = {
      ...data,
      id: `exp_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalState.expenses = [expense, ...globalState.expenses];
    await storage.saveExpenses(globalState.expenses);
    logActivity({
      userId: data.enteredBy,
      userName: globalState.currentUser?.name ?? '',
      action: 'add',
      expenseId: expense.id,
      details: `Added ${data.type} expense: ${data.category} - Rs. ${data.amount}`,
    });
    notify();
    return expense;
  }, []);

  const editExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    globalState.expenses = globalState.expenses.map(e =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    await storage.saveExpenses(globalState.expenses);
    logActivity({
      userId: globalState.currentUser?.id ?? '',
      userName: globalState.currentUser?.name ?? '',
      action: 'edit',
      expenseId: id,
      details: `Edited expense`,
    });
    notify();
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const expense = globalState.expenses.find(e => e.id === id);
    globalState.expenses = globalState.expenses.filter(e => e.id !== id);
    await storage.saveExpenses(globalState.expenses);
    logActivity({
      userId: globalState.currentUser?.id ?? '',
      userName: globalState.currentUser?.name ?? '',
      action: 'delete',
      expenseId: id,
      details: `Deleted expense: ${expense?.category} - Rs. ${expense?.amount}`,
    });
    notify();
  }, []);

  const approveExpense = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    await editExpense(id, { status });
    logActivity({
      userId: globalState.currentUser?.id ?? '',
      userName: globalState.currentUser?.name ?? '',
      action: status === 'approved' ? 'approve' : 'reject',
      expenseId: id,
      details: `Expense ${status}`,
    });
  }, [editExpense]);

  const saveBudget = useCallback(async (budget: Omit<Budget, 'id'>) => {
    const existing = globalState.budgets.find(
      b => b.type === budget.type && b.month === budget.month && b.year === budget.year
    );
    if (existing) {
      globalState.budgets = globalState.budgets.map(b =>
        b.id === existing.id ? { ...b, limit: budget.limit } : b
      );
    } else {
      globalState.budgets = [...globalState.budgets, { ...budget, id: `bgt_${Date.now()}` }];
    }
    await storage.saveBudgets(globalState.budgets);
    notify();
  }, []);

  const toggleApprovalMode = useCallback(async () => {
    globalState = { ...globalState, approvalMode: !globalState.approvalMode };
    await storage.setApprovalMode(globalState.approvalMode);
    notify();
  }, []);

  return {
    ...globalState,
    login,
    logout,
    addExpense,
    editExpense,
    deleteExpense,
    approveExpense,
    saveBudget,
    toggleApprovalMode,
  };
}
