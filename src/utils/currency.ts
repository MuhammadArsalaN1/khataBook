import { Currency } from '../types';
import { CURRENCIES, DEFAULT_EXCHANGE_RATES } from '../constants';

export type ExchangeRates = Record<Currency, number>;

/** Format an amount in its native currency, e.g. "$1,200.00" or "Rs. 45,000". */
export function formatMoney(amount: number, currency: Currency = 'PKR'): string {
  const { symbol } = CURRENCIES[currency];
  const fractionDigits = currency === 'PKR' ? 0 : 2;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${symbol} ${formatted}`;
}

/** Convert any currency amount into PKR using the supplied (or default) rates. */
export function toPKR(amount: number, currency: Currency, rates?: ExchangeRates): number {
  const r = rates ?? DEFAULT_EXCHANGE_RATES;
  return amount * (r[currency] ?? 1);
}

/** Compact PKR display, e.g. "Rs. 1.2M" / "Rs. 45.0k". */
export function formatPKRCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `Rs. ${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `Rs. ${(amount / 1_000).toFixed(1)}k`;
  return `Rs. ${Math.round(amount).toLocaleString()}`;
}
