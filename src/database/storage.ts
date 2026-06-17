import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, ActivityLog, Budget, User } from '../types';
import { STORAGE_KEYS } from '../constants';

export const getExpenses = async (): Promise<Expense[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
  return data ? JSON.parse(data) : [];
};

export const saveExpenses = async (expenses: Expense[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
};

export const getActivityLogs = async (): Promise<ActivityLog[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
  return data ? JSON.parse(data) : [];
};

export const saveActivityLogs = async (logs: ActivityLog[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
};

export const getBudgets = async (): Promise<Budget[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
  return data ? JSON.parse(data) : [];
};

export const saveBudgets = async (budgets: Budget[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
};

export const getCurrentUser = async (): Promise<User | null> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = async (user: User | null): Promise<void> => {
  if (user) {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

export const getApprovalMode = async (): Promise<boolean> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.APPROVAL_MODE);
  return data === 'true';
};

export const setApprovalMode = async (enabled: boolean): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.APPROVAL_MODE, String(enabled));
};
