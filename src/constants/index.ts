import { User, ExpenseType, Currency, PaymentMethod } from '../types';

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
  // Brand — White / Black / Yellow theme.
  // `primary` = the interactive/ink color (black) so buttons keep white text.
  // `accent` = the yellow highlight (progress bars, pills, selected states).
  primary: '#1A1A1A',
  primaryLight: '#FCD34D',   // soft yellow tint (used as pale backgrounds)
  primaryDark: '#000000',
  accent: '#F5B700',         // signature yellow
  accentDark: '#D99E00',
  accentSoft: '#FEF3C7',     // pale yellow surface
  onAccent: '#1A1A1A',       // text on yellow
  secondary: '#CA8A04',      // gold (secondary accents)
  // Semantic
  success: '#16A34A',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  // Types
  personal: '#1A1A1A',
  personalLight: '#E5E5E5',
  personalBg: '#FAFAFA',
  personalGradient: ['#3A3A3A', '#1A1A1A'],
  office: '#F5B700',
  officeLight: '#FEF3C7',
  officeBg: '#FFFDF5',
  officeGradient: ['#FACC15', '#F5B700'],
  farm: '#16A34A',
  farmLight: '#D1FAE5',
  farmBg: '#F0FDF4',
  farmGradient: ['#22C55E', '#16A34A'],
  // UI — soft white surfaces, rounded cards
  background: '#FAFAF7',
  card: '#FFFFFF',
  cardSecondary: '#F5F5F0',
  border: '#ECECE6',
  divider: '#F0F0EA',
  // Text — black & readable
  text: '#1A1A1A',
  textMed: '#52525B',
  textLight: '#9C9C95',
  textAlt: '#B4B4AD',
  // Misc
  white: '#FFFFFF',
  dark: '#1A1A1A',
  overlay: 'rgba(26,26,26,0.5)',
  overlayLight: 'rgba(26,26,26,0.2)',
  shadow: 'rgba(0,0,0,0.08)',
  shadowDark: 'rgba(0,0,0,0.14)',
  // Chart palette — black/yellow led
  chart: ['#1A1A1A','#F5B700','#16A34A','#EF4444','#CA8A04','#52525B','#FACC15','#84CC16'],
  // Gradient presets
  incomeGradient: ['#22C55E', '#16A34A'],
  expenseGradient: ['#F87171', '#EF4444'],
  balanceGradient: ['#FACC15', '#F5B700'],
};

// Centralized gradients used across screens (soft, premium).
export const GRADIENTS = {
  header: ['#FFE9A8', '#FACC15', '#F5B700'] as string[], // soft gold
  gold: ['#FDE68A', '#F5B700'] as string[],
  dark: ['#2A2A2A', '#1A1A1A'] as string[],
  card: ['#FFFFFF', '#FFFDF5'] as string[],
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

// Emoji per category for transaction rows / lists.
export const CATEGORY_EMOJI: Record<string, string> = {
  // personal
  Grocery: '🛒', Fuel: '⛽', 'Utility Bills': '💡', Internet: '🌐', Medical: '💊',
  Education: '📚', Dining: '🍽️', Shopping: '🛍️', Travel: '✈️', Entertainment: '🎬',
  Subscriptions: '📱',
  // office
  Rent: '🏠', Electricity: '⚡', 'Hosting & Domains': '🖥️', 'Software Subscriptions': '💻',
  'Marketing & Ads': '📣', Salaries: '💼', 'Office Supplies': '🗂️', Equipment: '🔧',
  Maintenance: '🔨',
  // farm
  Feed: '🌾', Medicine: '💉', Vaccination: '🩹', Labor: '👷', Transportation: '🚛',
  Water: '💧', 'Shed Maintenance': '🏚️', 'Medical Treatment': '🏥',
  // shared
  Miscellaneous: '📦',
};

export const PAYMENT_METHODS = {
  cash: { label: 'Cash', icon: '💵', color: '#10B981' },
  bank: { label: 'Bank Transfer', icon: '🏦', color: '#3B82F6' },
  digital: { label: 'Digital', icon: '📱', color: '#8B5CF6' },
  jazzcash: { label: 'JazzCash', icon: '📞', color: '#E52C2C' },
  paypal: { label: 'PayPal', icon: '🌐', color: '#003087' },
  payoneer: { label: 'Payoneer', icon: '💳', color: '#07A41E' },
};

// Wallet providers with currency support + premium gradient styling.
// PKR wallets are single-currency; PayPal/Payoneer can hold USD/EUR/GBP.
export type WalletBrand = 'jazzcash' | 'paypal' | 'payoneer' | 'cash' | 'bank';

export interface WalletMeta {
  id: PaymentMethod;
  name: string;
  icon: string;            // emoji fallback
  lottie: string;          // AnimatedIcon name (see LOTTIE_ICONS)
  brand: WalletBrand;      // drives the branded card styling
  color: string;
  gradient: string[];
  currencies: Currency[];  // currencies this wallet can hold
  agencies: string[];      // sub-accounts under this provider
}

// Brand-accurate gradients + wordmarks for the payment cards.
export const WALLETS: WalletMeta[] = [
  { id: 'cash',     name: 'Cash',     icon: '💵', lottie: 'cash',   brand: 'cash',     color: '#059669', gradient: ['#34D399', '#059669'], currencies: ['PKR'], agencies: ['Cash'] },
  { id: 'bank',     name: 'Bank',     icon: '🏦', lottie: 'bank',   brand: 'bank',     color: '#2563EB', gradient: ['#60A5FA', '#1E40AF'], currencies: ['PKR'], agencies: ['Bank'] },
  { id: 'jazzcash', name: 'JazzCash', icon: '📲', lottie: 'mobile', brand: 'jazzcash', color: '#ED1C24', gradient: ['#F0353C', '#B3151B'], currencies: ['PKR'], agencies: ['Main'] },
  { id: 'paypal',   name: 'PayPal',   icon: '🅿️', lottie: 'paypal', brand: 'paypal',   color: '#0070BA', gradient: ['#009CDE', '#003087'], currencies: ['GBP', 'USD', 'EUR'], agencies: ['Hybrid'] },
  { id: 'payoneer', name: 'Payoneer', icon: '💳', lottie: 'card',   brand: 'payoneer', color: '#FF4800', gradient: ['#FF7A00', '#E03E00'], currencies: ['USD', 'EUR', 'GBP'], agencies: ['Hybrid', 'ArsalanCo1', 'AlwaysDigital'] },
];

export const CURRENCIES: Record<Currency, { symbol: string; label: string; flag: string }> = {
  PKR: { symbol: 'Rs.', label: 'Pakistani Rupee', flag: '🇵🇰' },
  USD: { symbol: '$',   label: 'US Dollar',        flag: '🇺🇸' },
  EUR: { symbol: '€',   label: 'Euro',             flag: '🇪🇺' },
  GBP: { symbol: '£',   label: 'British Pound',    flag: '🇬🇧' },
};

// Default conversion rates to PKR (editable in Settings → stored in Firebase settings).
export const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  PKR: 1,
  USD: 278,
  EUR: 300,
  GBP: 352,
};

// Dashboard fiscal-month config: month runs 1st–end, but the UI "rolls over"
// to the next fiscal month on this day so late entries still land in the prior month.
export const FISCAL_RESET_DAY = 3;

// Lottie animated-icon registry. Files live in assets/lottie/<name>.json.
// AnimatedIcon falls back to the emoji if a file is missing, so the app
// works immediately even before the .json files are added.
export const LOTTIE_ICONS: Record<string, { source: any | null; emoji: string }> = {
  cash:      { source: null, emoji: '💵' },
  bank:      { source: null, emoji: '🏦' },
  mobile:    { source: null, emoji: '📲' },
  paypal:    { source: null, emoji: '🌐' },
  card:      { source: null, emoji: '💳' },
  income:    { source: null, emoji: '🪙' },
  expense:   { source: null, emoji: '🧾' },
  wallet:    { source: null, emoji: '💼' },
  analytics: { source: null, emoji: '📈' },
  bell:      { source: null, emoji: '🔔' },
  goal:      { source: null, emoji: '🎯' },
  transfer:  { source: null, emoji: '🔁' },
};

export const STORAGE_KEYS = {
  EXPENSES: 'khata_expenses',
  ACTIVITY_LOGS: 'khata_activity_logs',
  BUDGETS: 'khata_budgets',
  CURRENT_USER: 'khata_current_user',
  APPROVAL_MODE: 'khata_approval_mode',
};
