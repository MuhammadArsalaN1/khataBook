export type UserRole = 'admin' | 'user';

export type ExpenseType = 'personal' | 'office' | 'farm';

export type PaymentMethod = 'cash' | 'bank' | 'digital' | 'jazzcash' | 'paypal' | 'payoneer';

export type Currency = 'PKR' | 'USD' | 'EUR' | 'GBP';

export type Theme = 'light' | 'dark';

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
  advanceId?: string;   // if paid from an old advance/float; '' or absent = main funds
  source?: AdvanceBalanceSource; // 'advance' | 'personal' (default: 'personal')
  advanceEntryId?: string;       // If source is 'advance', which entry
}

export type AdvanceDirection = 'given' | 'received';

export interface Advance {
  id: string;
  direction: AdvanceDirection; // 'given' = money you gave out; 'received' = money you borrowed
  person: string;              // free-text person name (e.g. "Ali", "Ahmed")
  amount: number;
  date: string;
  notes?: string;
  status: 'active' | 'settled';
  returnedAmount?: number;     // cash returned at settlement
  createdBy: string;           // app user id who recorded it
  createdAt: string;
  updatedAt: string;
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
  status?: ExpenseStatus;   // pending until admin approves (approval mode)
  enteredBy?: string;       // user id who set it
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
  agency: string;       // sub-account, e.g. "Hybrid", "ArsalanCo1", "Main"
  balance: number;
  currency: Currency;
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

// Budget Pools: Allocate money to specific spending categories (Diesel, Labor, etc.)
export interface BudgetPool {
  id: string;
  name: string;            // "Diesel", "Labor", "Maintenance", etc.
  type: ExpenseType;       // personal | office | farm
  allocatedAmount: number; // How much to spend this month
  spent: number;           // Calculated from linked expenses
  remaining: number;       // allocatedAmount - spent
  month: number;
  year: number;
  linkedCategories: string[]; // Which categories count toward this pool
  alertThreshold: number;  // Alert at 80% (as percentage: 80)
  createdAt: string;
  updatedAt: string;
}

// Recurrence Rule: Define when and how expenses repeat
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurrenceRule {
  id: string;
  expenseTemplate: {  // The template to use for generating expenses
    type: ExpenseType;
    category: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes: string;
  };
  frequency: RecurrenceFrequency;
  dayOfMonth?: number;      // For monthly: which day (1-31)
  dayOfWeek?: number;       // For weekly: 0=Sun, 1=Mon, etc.
  startDate: string;        // When to start repeating
  endDate?: string;         // When to stop (optional)
  active: boolean;
  nextDueDate: string;      // Next auto-create date
  lastCreatedDate?: string; // Last time an expense was auto-created
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Monthly Trend Point for analytics
export interface SpendingTrendPoint {
  month: number;
  year: number;
  label: string;           // "May 2024"
  total: number;
  byType: { personal: number; office: number; farm: number };
  byCategory: Record<string, number>;
  change?: number;         // % change from previous month
  changeAmount?: number;   // Amount change from previous month
}

// Comparison for analytics
export interface SpendingComparison {
  thisMonth: number;
  lastMonth: number;
  threeMonthAvg: number;
  sixMonthAvg: number;
  lastYear: number;
  percentChange: number;
}

// ============================================================================
// ADVANCE BALANCE FEATURE: Transfer funds between users/team members
// ============================================================================

export type AdvanceBalanceSource = 'advance' | 'personal';

export interface AdvanceBalanceEntry {
  id: string;
  giverName: string;           // Name of person giving (e.g., "Arsalan", "Rehan")
  giverEmail: string;          // Auto-resolved email (e.g., "arsalan@itcorpinc.com" or "others")
  receiverName: string;        // Name of person receiving
  receiverEmail: string;       // Auto-resolved email (e.g., "rehan@itcorpinc.com" or "others")
  amount: number;              // Original advance amount
  direction: 'given' | 'received'; // From logged-in user's perspective
  transactionDate: string;
  notes?: string;
  status: 'active' | 'settled'; // settled = receiver has returned full amount
  returnedAmount: number;      // Amount returned so far (default: 0)
  pendingAmount: number;       // Amount still pending (amount - returnedAmount)
  returnHistory: AdvanceReturn[]; // Track each return entry
  createdBy: string;           // Logged-in user who created this entry
  createdAt: string;
  updatedAt: string;
}

export interface AdvanceReturn {
  id: string;
  date: string;
  amount: number;
  method: string;              // 'cash' | 'bank' | 'digital' | 'adjustment'
  notes?: string;
  recordedBy: string;          // User who recorded the return
  createdAt: string;
}

export interface UserAdvanceBalance {
  email: string;               // User email (rehan@itcorpinc.com or "others")
  displayName: string;         // Display name (Rehan or Others)
  balance: number;             // Current advance balance (positive = they owe, negative = owed to them)
  totalReceived: number;       // Total advances received
  totalGiven: number;          // Total advances given
  settledCount: number;
  activeCount: number;
  lastTransaction?: string;
}

export interface AdvanceBalanceTransaction {
  id: string;
  advanceEntryId: string;
  expenseId: string;
  amount: number;
  category: string;
  description: string;
  transactionDate: string;
  createdAt: string;
}

export interface AdvanceBalanceSummary {
  email: string;
  displayName: string;
  balance: number;
  totalReceived: number;
  totalGiven: number;
  activeAdvances: number;
  recentTransactions: AdvanceBalanceTransaction[];
}

