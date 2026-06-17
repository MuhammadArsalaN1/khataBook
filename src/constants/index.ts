import { User, ExpenseType } from '../types';

export const USERS: User[] = [
  { id: 'arsalan', name: 'Arsalan', email: 'arsalan@itcorpinc.com', role: 'admin' },
  { id: 'rehan', name: 'Rehan', email: 'rehan@itcorpinc.com', role: 'user' },
];

export const CATEGORIES: Record<ExpenseType, string[]> = {
  personal: [
    'Grocery', 'Fuel', 'Utility Bills', 'Internet', 'Medical',
    'Education', 'Dining', 'Shopping', 'Travel', 'Entertainment',
    'Subscriptions', 'Miscellaneous',
  ],
  office: [
    'Rent', 'Electricity', 'Internet', 'Hosting & Domains',
    'Software Subscriptions', 'Marketing & Ads', 'Salaries',
    'Office Supplies', 'Equipment', 'Travel', 'Maintenance', 'Miscellaneous',
  ],
  farm: [
    'Feed', 'Medicine', 'Vaccination', 'Labor', 'Transportation',
    'Water', 'Electricity', 'Shed Maintenance', 'Medical Treatment', 'Miscellaneous',
  ],
};

export const COLORS = {
  primary: '#2563EB',
  secondary: '#7C3AED',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  personal: '#3B82F6',
  office: '#8B5CF6',
  farm: '#10B981',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textLight: '#64748B',
  white: '#FFFFFF',
};

export const TYPE_LABELS: Record<ExpenseType, string> = {
  personal: 'Personal',
  office: 'Office',
  farm: 'Goat Farm',
};

export const TYPE_COLORS: Record<ExpenseType, string> = {
  personal: COLORS.personal,
  office: COLORS.office,
  farm: COLORS.farm,
};

export const STORAGE_KEYS = {
  EXPENSES: 'khata_expenses',
  ACTIVITY_LOGS: 'khata_activity_logs',
  BUDGETS: 'khata_budgets',
  CURRENT_USER: 'khata_current_user',
  APPROVAL_MODE: 'khata_approval_mode',
};
