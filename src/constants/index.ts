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
  // Brand - Premium
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  secondary: '#06B6D4',
  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  // Types - Premium gradients
  personal: '#3B82F6',
  personalLight: '#DBEAFE',
  personalBg: '#F0F9FF',
  personalGradient: ['#60A5FA', '#3B82F6'],
  office: '#8B5CF6',
  officeLight: '#EDE9FE',
  officeBg: '#FAF5FF',
  officeGradient: ['#A78BFA', '#8B5CF6'],
  farm: '#10B981',
  farmLight: '#D1FAE5',
  farmBg: '#F0FDF4',
  farmGradient: ['#34D399', '#10B981'],
  // UI - Premium & Modern
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardSecondary: '#F1F5F9',
  border: '#E2E8F0',
  divider: '#E2E8F0',
  // Text - Dark & Readable
  text: '#1E293B',
  textMed: '#475569',
  textLight: '#78909C',
  textAlt: '#9CA3AF',
  // Misc
  white: '#FFFFFF',
  dark: '#0F172A',
  overlay: 'rgba(15,23,42,0.5)',
  overlayLight: 'rgba(15,23,42,0.2)',
  // Shadow colors for depth
  shadow: 'rgba(0,0,0,0.1)',
  shadowDark: 'rgba(0,0,0,0.15)',
  // Chart palette - Premium
  chart: ['#7C3AED','#06B6D4','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899','#14B8A6'],
  // Gradient presets
  incomeGradient: ['#34D399', '#10B981'],
  expenseGradient: ['#F87171', '#EF4444'],
  balanceGradient: ['#60A5FA', '#3B82F6'],
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
