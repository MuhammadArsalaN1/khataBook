# 📒 Khata Book — Personal Finance Tracker

**Khata Book** is a modern, offline-first personal finance tracker built with **Expo React Native**, **Firebase**, and **TypeScript**. Track expenses across multiple categories (Personal, Office, Goat Farm), manage advances/floats, set budgets, and gain real-time insights into your spending.

Designed for **Arsalan & Rehan** — Pakistani rupees (PKR) with USD/EUR/GBP support.

---

## ✨ Key Features

### 💰 **Expense Tracking**
- 🔍 Multi-type expenses: **Personal**, **Office**, **Goat Farm**
- 📂 **25+ expense categories** per type (Grocery, Pet Food, Veterinary Services, etc.)
- 📷 Receipt attachment (camera/gallery)
- 💳 **6 payment methods**: Cash, Bank, JazzCash, PayPal, Payoneer, Digital
- 🔄 Recurring expense tracking
- ✏️ Full expense history with drill-down charts

### 🤝 **Funds & Advances** (NEW)
- 💸 Give / Receive advances to people (free-text names, not limited to app users)
- 💰 **Fund-source selection** per expense: Main Balance or any active advance
- 📊 **Balance visualization**: Original → Used → Remaining
- 🔔 Insufficient balance warnings with fallback to Main Balance
- ⚖️ Settle advances: Return cash or mark as consumed
- 📜 Full transaction history linked to each advance

### 📊 **Dashboard & Analytics**
- 📈 Real-time charts: Income, Expenses, Savings trends
- 📉 **Category breakdown** with tap-to-drill daily bar graphs
- 💳 Wallet balance tracking (PKR + multi-currency)
- 📌 Savings goals & progress
- 🏦 Main Balance (computed from all events, never stored)

### 💼 **Budget Management**
- 📊 Monthly budget limits per type (Personal, Office, Farm)
- ⚠️ Progress tracking with visual indicators
- 📝 Editable from Settings

### 🛡️ **Admin & Approval Mode**
- 👤 Dual-user setup (Admin + User) with role-based permissions
- ✅ Approval workflow: Admin can approve/reject pending entries
- 📋 Activity logs: Every action tracked with user, timestamp, change details

### 🌐 **Multi-Currency Support**
- 🇵🇰 Primary: PKR (Pakistani Rupee)
- 🇺🇸 🇪🇺 🇬🇧 Secondary: USD, EUR, GBP
- 📈 Editable exchange rates in Settings

### 🔐 **Security**
- 📱 Biometric login (Face ID / Fingerprint)
- 🔒 Firebase Authentication
- 🗂️ Secure credential storage (expo-secure-store)
- 🔑 Read-only permission model for non-admins

### 📱 **Offline-First**
- ☁️ Real-time sync via Firestore listeners
- 💾 Local state caching with useStore (global Zustand-like store)
- 🔄 Auto-sync when online

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** or **yarn**
- **Expo CLI** (install globally: `npm install -g expo-cli`)
- **Firebase project** (free tier works fine)

### 1. Clone the Repository

```bash
git clone https://github.com/MuhammadArsalaN1/khataBook.git
cd khataBook
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Firebase

#### Step A: Create a Firebase Project
1. Go to **[Firebase Console](https://console.firebase.google.com/)**
2. Click **"Create a project"**
3. Name it (e.g., "Khata Book"), accept the defaults, and create
4. Go to **Project Settings** (gear icon → Project Settings)
5. Scroll down to **"Your apps"** → Click **"Web"** (if not already added)
6. Copy the entire config object (contains apiKey, authDomain, etc.)

#### Step B: Add Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your Firebase credentials:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy... (from console)
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:...
   ```

#### Step C: Update Firebase Config (Optional)
If you want to use environment variables instead of hardcoded values, update `src/config/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
```

### 4. Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose your region (close to you for best latency)
5. Click **"Enable"**

### 5. Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** (required for login)
3. (Optional) Enable **Google Sign-In** for OAuth

### 6. Run the App

```bash
# Start Expo development server
npx expo start

# Run on specific platform:
# iOS: press 'i' (macOS only)
# Android: press 'a'
# Web: press 'w'
# Expo Go app: scan the QR code with your phone
```

---

## 📁 Project Structure

```
khataBook/
├── src/
│   ├── screens/          # Screen components (Dashboard, Expenses, Analytics, etc.)
│   │   ├── Dashboard/
│   │   ├── Expenses/
│   │   ├── Funds/        # Funds & Advances module (NEW)
│   │   ├── Analytics/
│   │   ├── Settings/
│   │   └── Auth/
│   ├── components/       # Reusable UI components
│   ├── store/           # Global state (useStore with Zustand pattern)
│   ├── types/           # TypeScript interfaces (Expense, Income, Advance, etc.)
│   ├── utils/           # Helpers (currency, fiscal months, funds, biometric)
│   ├── database/        # Firebase helpers (storage.ts with CRUD functions)
│   ├── constants/       # Colors, categories, payment methods, emojis
│   ├── config/          # Firebase config
│   └── navigation/      # React Navigation setup
├── assets/              # Icons, images, Lottie animations
├── app.json             # Expo config (permissions, plugins, icons)
├── eas.json             # EAS Build config (for native builds)
├── .env.example         # Firebase credentials template (copy to .env)
├── .gitignore           # Excludes node_modules, .env, sensitive files
└── README.md            # This file
```

### Key Files

- **`src/store/useStore.ts`** — Global state: expenses, incomes, advances, wallets, budgets, approvals
- **`src/types/index.ts`** — TypeScript definitions for all data models
- **`src/utils/funds.ts`** — Advance calculations (remaining, spent, main balance)
- **`src/database/storage.ts`** — Firebase Firestore read/write functions
- **`src/constants/index.ts`** — Categories (25+ per type), colors, emojis
- **`src/screens/Funds/FundsScreen.tsx`** — Funds & Advances UI (give/receive/settle)

---

## 🛠️ Development

### Change Custom Domain

Currently hardcoded to **itcorpinc**. To change:

1. **App Name** → `app.json`:
   ```json
   "name": "Your App Name",
   "slug": "your-slug",
   ```

2. **Bundle IDs** (iOS/Android) → `app.json`:
   ```json
   "ios": { "bundleIdentifier": "com.yourcompany.app" },
   "android": { "package": "com.yourcompany.app" }
   ```

3. **Firestore collections** → Already generic (`expenses`, `incomes`, `advances`, etc.), no changes needed

### Change Color Scheme

Edit `src/constants/index.ts`:
- `COLORS` — Primary (black), accent (yellow), semantic colors
- `GRADIENTS` — Header, card, dark gradients
- `TYPE_COLORS` — Per-type colors (Personal, Office, Farm)

### Add New Expense Categories

Edit `src/constants/index.ts`:
```typescript
export const CATEGORIES: Record<ExpenseType, string[]> = {
  personal: [..., 'New Category'],
  // ...
};

export const CATEGORY_EMOJI: Record<string, string> = {
  'New Category': '🎯',
  // ...
};
```

---

## 📱 Building for Production

### iOS Build (macOS only)

```bash
eas build --platform ios --profile production
```

### Android Build

```bash
eas build --platform android --profile production
```

### Both Platforms

```bash
eas build --profile production
```

**Note:** Requires EAS account (free tier available at https://expo.dev/)

---

## 🐛 Troubleshooting

### Black Screen After Biometric Update
If you see a black screen after updating biometric features:
```bash
npx expo start -c
```
The `-c` clears the Metro bundler cache, forcing a fresh bundle rebuild.

### Firebase "Missing/Invalid API Key"
- Double-check `.env` values match your Firebase Console exactly
- For web, the API key is **intentionally public** (client-side only)
- Secure your data with **Firestore Security Rules** (set in Firebase Console)

### Firestore "Permission Denied"
- In Firebase Console → Firestore Database → Rules
- During development, use **"Start in test mode"** (auto-generated open rules)
- For production, restrict to authenticated users:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

### Expo Go vs Native Build
- **Expo Go** (quick testing): `npx expo start` → scan QR code
- **Native build** (for app stores): `eas build --profile production`

---

## 📚 Technologies

- **Frontend:** Expo (React Native), TypeScript, React Navigation
- **Backend:** Firebase (Auth + Firestore)
- **State Management:** useStore (Zustand-like pattern)
- **UI:** Custom components, LinearGradient, Lottie animations
- **Security:** expo-secure-store, expo-local-authentication (biometric)
- **Testing:** TypeScript for type safety

---

## 🤝 Contributing

Contributions are welcome! Fork the repo, make changes, and submit a pull request.

### Development Workflow
1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally: `npx expo start`
3. Commit with clear messages: `git commit -m "Add feature X"`
4. Push and open a Pull Request

---

## 📄 License

MIT License — See [LICENSE](LICENSE) file for details.

---

## 👨‍💼 Credits

Built by **Arsalan & Rehan** using Expo React Native.

---

## 📞 Support

- 🐛 **Found a bug?** Open an issue on GitHub
- 💡 **Feature request?** Discuss in Issues or Discussions
- 📧 **Questions?** Create a Discussion thread

---

## 🎯 Roadmap

- [ ] Expense reports (PDF/CSV export)
- [ ] Per-person finance profiles (employee reimbursements)
- [ ] Budget pools (Diesel, Labor, Maintenance with limits)
- [ ] SMS/Push notifications for approvals
- [ ] Dark mode
- [ ] Web dashboard (for analytics)
- [ ] Calendar view (expenses by date)

---

**Happy tracking! 📊**
