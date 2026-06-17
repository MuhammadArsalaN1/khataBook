export type UserRole = 'admin' | 'user';

export type ExpenseType = 'personal' | 'office' | 'farm';

export type PaymentMethod = 'cash' | 'bank' | 'digital' | 'jazzcash' | 'paypal' | 'payoneer';

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type ActionType = 'add' | 'edit' | 'delete' | 'approve' | 'reject';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Expense {
  id: string;
  type: ExpenseType;
  category: string;
  amount: number;
  date: string; // ISO string
  notes: string;
  paymentMethod: PaymentMethod;
  enteredBy: string; // user id
  createdAt: string;
  updatedAt: string;
  status: ExpenseStatus;
  receiptUri?: string;
  isRecurring: boolean;
  recurringMonths?: number[];
  tags?: string[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: ActionType;
  expenseId: string;
  details: string;
  timestamp: string;
}

export interface Budget {
  id: string;
  type: ExpenseType;
  month: number;
  year: number;
  limit: number;
}

export interface RecurringExpense {
  id: string;
  expenseId: string;
  nextDue: string;
  active: boolean;
}

export interface Income {
  id: string;
  type: ExpenseType;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
}

export interface MonthlyComparison {
  label: string;
  total: number;
  personal: number;
  office: number;
  farm: number;
  change?: number;
}

export interface Wallet {
  id: string;
  userId: string;
  provider: PaymentMethod;
  balance: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: ExpenseType;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseTemplate {
  id: string;
  userId: string;
  name: string;
  type: ExpenseType;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}
