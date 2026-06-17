import { User, ExpenseType } from '../types';

export const USERS: User[] = [
  { id: 'arsalan', name: 'Arsalan', email: 'arsalan@itcorpinc.com', role: 'admin' },
  { id: 'rehan', name: 'Rehan', email: 'rehan@itcorpinc.com', role: 'user' },
];

export const CATEGORIES: Record<ExpenseType, string[]> = {
  personal: ['Grocery','Fuel','Utility Bills','Internet','Medical','Education','Dining','Shopping','Travel','Entertainment','Subscriptions','Miscellaneous'],
  office: ['Rent','Electricity','Internet','Hosting & Domains','Software Subscriptions','Marketing & Ads','Salaries','Office Supplies','Equipment','Travel','Maintenance','Miscellaneous'],
  farm: ['Feed','Medicine','Vaccination','Labor','Transportation','Water','Electricity','Shed Maintenance','Medical Treatment','Miscellaneous'],
};

export const COLORS = {
  // Brand
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  secondary: '#7C3AED',
  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  // Types
  personal: '#3B82F6',
  personalLight: '#DBEAFE',
  office: '#8B5CF6',
  officeLight: '#EDE9FE',
  farm: '#10B981',
  farmLight: '#D1FAE5',
  // UI
  background: '#F8FAFF',
  card: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  // Text
  text: '#0F172A',
  textMed: '#475569',
  textLight: '#94A3B8',
  // Misc
  white: '#FFFFFF',
  dark: '#0F172A',
  overlay: 'rgba(15,23,42,0.6)',
  // Glass-morphism
  glassLight: 'rgba(255,255,255,0.15)',
  glassMedium: 'rgba(255,255,255,0.25)',
  glassDark: 'rgba(15,23,42,0.1)',
  // Chart palette
  chart: ['#4F46E5','#7C3AED','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899','#14B8A6'],
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

export const TYPE_LIGHT: Record<ExpenseType, string> = {
  personal: COLORS.personalLight,
  office: COLORS.officeLight,
  farm: COLORS.farmLight,
};

export const TYPE_ICONS: Record<ExpenseType, string> = {
  personal: '👤',
  office: '🏢',
  farm: '🐐',
};

export const PAYMENT_METHODS = {
  cash: { label: 'Cash', icon: '💵', color: '#10B981' },
  bank: { label: 'Bank Transfer', icon: '🏦', color: '#3B82F6' },
  digital: { label: 'Digital', icon: '📱', color: '#8B5CF6' },
  jazzcash: { label: 'JazzCash', icon: '📞', color: '#E52C2C' },
  paypal: { label: 'PayPal', icon: '🌐', color: '#003087' },
  payoneer: { label: 'Payoneer', icon: '💳', color: '#07A41E' },
};

export const WALLETS = [
  { id: 'cash', name: 'Cash', icon: '💵', color: PAYMENT_METHODS.cash.color },
  { id: 'bank', name: 'Bank', icon: '🏦', color: PAYMENT_METHODS.bank.color },
  { id: 'jazzcash', name: 'JazzCash', icon: '📞', color: PAYMENT_METHODS.jazzcash.color },
  { id: 'paypal', name: 'PayPal', icon: '🌐', color: PAYMENT_METHODS.paypal.color },
  { id: 'payoneer', name: 'Payoneer', icon: '💳', color: PAYMENT_METHODS.payoneer.color },
];

export const STORAGE_KEYS = {
  EXPENSES: 'khata_expenses',
  ACTIVITY_LOGS: 'khata_activity_logs',
  BUDGETS: 'khata_budgets',
  CURRENT_USER: 'khata_current_user',
  APPROVAL_MODE: 'khata_approval_mode',
};
