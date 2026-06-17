# Animated (Lottie) Icons

The app uses [Lottie](https://lottiefiles.com) JSON animations for premium animated
icons. Until the `.json` files are added here, the UI automatically falls back to
emoji glyphs — so everything works right now, and "lights up" once you add the files.

## How to add them

1. Download these animations as **Lottie JSON** (from
   [iconscout.com](https://iconscout.com/lotties) or [lottiefiles.com](https://lottiefiles.com)).
   Pick the 3D / animated style you like — just keep the file names below.
2. Drop the `.json` files into this folder (`assets/lottie/`).
3. Open `src/constants/index.ts` and set each `source` in `LOTTIE_ICONS`, e.g.:

   ```ts
   cash:    { source: require('../../assets/lottie/cash.json'),    emoji: '💵' },
   bank:    { source: require('../../assets/lottie/bank.json'),    emoji: '🏦' },
   ```

## Files expected

| File name        | Used for                       |
|------------------|--------------------------------|
| `cash.json`      | Cash wallet                    |
| `bank.json`      | Bank wallet                    |
| `mobile.json`    | JazzCash wallet                |
| `paypal.json`    | PayPal wallet                  |
| `card.json`      | Payoneer wallet                |
| `income.json`    | Add Income quick action        |
| `expense.json`   | Add Expense quick action       |
| `wallet.json`    | Wallets quick action / totals  |
| `analytics.json` | Analytics quick action         |
| `bell.json`      | Notification bell              |
| `goal.json`      | Savings goals                  |
| `transfer.json`  | Transfer action                |

That's it — no code changes needed beyond the `require()` wiring in `LOTTIE_ICONS`.
