import { User, ExpenseType, Currency, PaymentMethod } from '../types';

export const USERS: User[] = [
  { id: 'arsalan', name: 'Arsalan', email: 'arsalan@itcorpinc.com', role: 'admin' },
  { id: 'rehan', name: 'Rehan', email: 'rehan@itcorpinc.com', role: 'user' },
];

export const CATEGORIES: Record<ExpenseType, string[]> = {
  personal: [
    'Grocery','Fuel','Utility Bills','Internet','Medical','Medicine','Health Checkup','Education','Dining','Shopping','Travel',
    'Entertainment','Subscriptions','Phone & Mobile','Insurance','Books','Hobbies','Clothing','Personal Care','Beauty & Spa',
    'Home Maintenance','Furniture','Pet Food','Pet Care','Pet Medication','Appliances','Miscellaneous'
  ],
  office: [
    'Rent','Electricity','Internet','Hosting & Domains','Software Subscriptions','Marketing & Ads','Salaries','Office Supplies',
    'Equipment','Travel','Maintenance','Office Furniture','Cleaning Supplies','Employee Meals','Training & Development',
    'Legal & Accounting','Utilities','Repairs','Pest Control','Security','Miscellaneous'
  ],
  farm: [
    'Feed','Fodder & Hay','Medicine','Veterinary Services','Vaccination','Labor','Transportation','Water','Electricity',
    'Shed Maintenance','Medical Treatment','Equipment & Tools','Breeding Stock','Supplements','Grazing & Pasture',
    'Gate & Fencing','Bedding Material','Quarantine Care','Miscellaneous Supplies'
  ],
};

export const COLORS_LIGHT = {
  // Brand — White / Black / Yellow theme.
  primary: '#1A1A1A',
  primaryLight: '#FCD34D',
  primaryDark: '#000000',
  accent: '#F5B700',
  accentDark: '#D99E00',
  accentSoft: '#FEF3C7',
  onAccent: '#1A1A1A',
  secondary: '#CA8A04',
  success: '#D99E00',
  successLight: '#FEF3C7',
  warning: '#F5B700',
  warningLight: '#FEF3C7',
  danger: '#1A1A1A',
  dangerLight: '#F5F5F0',
  personal: '#1A1A1A',
  personalLight: '#ECECE6',
  personalBg: '#FAFAF7',
  personalGradient: ['#3A3A3A', '#1A1A1A'],
  office: '#F5B700',
  officeLight: '#FEF3C7',
  officeBg: '#FFFDF5',
  officeGradient: ['#FACC15', '#F5B700'],
  farm: '#D99E00',
  farmLight: '#FEF3C7',
  farmBg: '#FFFDF5',
  farmGradient: ['#F5B700', '#D99E00'],
  background: '#FAFAF7',
  card: '#FFFFFF',
  cardSecondary: '#F5F5F0',
  border: '#ECECE6',
  divider: '#F0F0EA',
  text: '#1A1A1A',
  textMed: '#52525B',
  textLight: '#9C9C95',
  textAlt: '#B4B4AD',
  white: '#FFFFFF',
  dark: '#1A1A1A',
  overlay: 'rgba(26,26,26,0.5)',
  overlayLight: 'rgba(26,26,26,0.2)',
  shadow: 'rgba(0,0,0,0.08)',
  shadowDark: 'rgba(0,0,0,0.14)',
  chart: ['#1A1A1A','#F5B700','#D99E00','#52525B','#FACC15','#9C9C95','#FDE68A','#B4B4AD'],
  incomeGradient: ['#F5B700', '#D99E00'],
  expenseGradient: ['#52525B', '#1A1A1A'],
  balanceGradient: ['#FACC15', '#F5B700'],
};

export const COLORS_DARK = {
  // Dark mode theme
  primary: '#F5F5F0',
  primaryLight: '#2A2A1A',
  primaryDark: '#FFFFFF',
  accent: '#FFA500',
  accentDark: '#FFB700',
  accentSoft: '#3A3A2A',
  onAccent: '#F5F5F0',
  secondary: '#FFB700',
  success: '#4ADE80',
  successLight: '#1E3A1F',
  warning: '#FFA500',
  warningLight: '#3A2A1A',
  danger: '#F87171',
  dangerLight: '#3A1A1A',
  personal: '#E0E0E0',
  personalLight: '#3A3A3A',
  personalBg: '#1A1A1A',
  personalGradient: ['#2A2A2A', '#1A1A1A'],
  office: '#FFB700',
  officeLight: '#3A2A1A',
  officeBg: '#2A1F0A',
  officeGradient: ['#FFB700', '#FFA500'],
  farm: '#FFB700',
  farmLight: '#3A2A1A',
  farmBg: '#2A1F0A',
  farmGradient: ['#FFA500', '#FFB700'],
  background: '#121212',
  card: '#1E1E1E',
  cardSecondary: '#2A2A2A',
  border: '#3A3A3A',
  divider: '#2A2A2A',
  text: '#F5F5F0',
  textMed: '#B0B0A0',
  textLight: '#808080',
  textAlt: '#606060',
  white: '#FFFFFF',
  dark: '#121212',
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',
  shadow: 'rgba(0,0,0,0.3)',
  shadowDark: 'rgba(0,0,0,0.5)',
  chart: ['#F5F5F0','#FFA500','#FFB700','#B0B0A0','#FFD700','#808080','#FFFF99','#606060'],
  incomeGradient: ['#FFA500', '#FFB700'],
  expenseGradient: ['#B0B0A0', '#F5F5F0'],
  balanceGradient: ['#FFD700', '#FFA500'],
};

// Default to light mode (can be switched via store)
export const COLORS = COLORS_LIGHT;

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
  Medicine: '💊', 'Health Checkup': '🏥', Education: '📚', Dining: '🍽️', Shopping: '🛍️',
  Travel: '✈️', Entertainment: '🎬', Subscriptions: '📱', 'Phone & Mobile': '📞',
  Insurance: '🛡️', Books: '📖', Hobbies: '🎨', Clothing: '👕', 'Personal Care': '🧴',
  'Beauty & Spa': '💇', 'Home Maintenance': '🔧', Furniture: '🪑', 'Pet Food': '🍖',
  'Pet Care': '🐾', 'Pet Medication': '💊', Appliances: '🔌',
  // office
  Rent: '🏠', Electricity: '⚡', 'Hosting & Domains': '🖥️', 'Software Subscriptions': '💻',
  'Marketing & Ads': '📣', Salaries: '💼', 'Office Supplies': '🗂️', Equipment: '🔧',
  Maintenance: '🔨', 'Office Furniture': '🪑', 'Cleaning Supplies': '🧹', 'Employee Meals': '🍱',
  'Training & Development': '📚', 'Legal & Accounting': '⚖️', Utilities: '💡', Repairs: '🔩',
  'Pest Control': '🐛', Security: '🔒',
  // farm
  Feed: '🌾', 'Fodder & Hay': '🌾', Vaccination: '🩹', 'Veterinary Services': '🏥',
  Labor: '👷', Water: '💧', 'Shed Maintenance': '🏚️', 'Medical Treatment': '🏥',
  'Equipment & Tools': '🔧', 'Breeding Stock': '🐐', Supplements: '💊', 'Grazing & Pasture': '🌱',
  'Gate & Fencing': '🚪', 'Bedding Material': '🛏️', 'Quarantine Care': '🏥',
  'Miscellaneous Supplies': '📦',
  // shared
  Miscellaneous: '📦',
};

export const PAYMENT_METHODS = {
  cash: { label: 'Cash', icon: '💵', color: '#D99E00' },
  bank: { label: 'Bank Transfer', icon: '🏦', color: '#1A1A1A' },
  digital: { label: 'Digital', icon: '📱', color: '#D99E00' },
  jazzcash: { label: 'JazzCash', icon: '📞', color: '#D99E00' },
  paypal: { label: 'PayPal', icon: '🌐', color: '#1A1A1A' },
  payoneer: { label: 'Payoneer', icon: '💳', color: '#D99E00' },
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
  { id: 'cash',     name: 'Cash',     icon: '💵', lottie: 'cash',   brand: 'cash',     color: '#F5B700', gradient: ['#3A3A3A', '#1A1A1A'], currencies: ['PKR'], agencies: ['Cash'] },
  { id: 'bank',     name: 'Bank',     icon: '🏦', lottie: 'bank',   brand: 'bank',     color: '#F5B700', gradient: ['#2E2E2E', '#1A1A1A'], currencies: ['PKR'], agencies: ['Bank'] },
  { id: 'jazzcash', name: 'JazzCash', icon: '📲', lottie: 'mobile', brand: 'jazzcash', color: '#F5B700', gradient: ['#2A2A2A', '#111111'], currencies: ['PKR'], agencies: ['Main'] },
  { id: 'paypal',   name: 'PayPal',   icon: '🅿️', lottie: 'paypal', brand: 'paypal',   color: '#F5B700', gradient: ['#2A2A2A', '#111111'], currencies: ['GBP', 'USD', 'EUR'], agencies: ['Hybrid'] },
  { id: 'payoneer', name: 'Payoneer', icon: '💳', lottie: 'card',   brand: 'payoneer', color: '#F5B700', gradient: ['#3A3A3A', '#111111'], currencies: ['USD', 'EUR', 'GBP'], agencies: ['Hybrid', 'ArsalanCo1', 'AlwaysDigital'] },
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
