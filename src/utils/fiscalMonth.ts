import { FISCAL_RESET_DAY } from '../constants';

export interface FiscalMonth {
  month: number; // 1-12
  year: number;
  label: string; // e.g. "June 2026"
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * The fiscal month the dashboard should currently display.
 * Calendar months run 1st–end, but the UI keeps showing the previous month
 * until FISCAL_RESET_DAY (the 3rd) of the next month, so late entries for the
 * old month still land in the right period. (Firebase always keeps everything.)
 */
export function getActiveFiscalMonth(now: Date = new Date()): FiscalMonth {
  let m = now.getMonth(); // 0-indexed
  let y = now.getFullYear();

  if (now.getDate() < FISCAL_RESET_DAY) {
    m -= 1;
    if (m < 0) { m = 11; y -= 1; }
  }

  return { month: m + 1, year: y, label: `${MONTH_NAMES[m]} ${y}` };
}

/** The exact moment the dashboard rolls over to the next fiscal month. */
export function getNextResetDate(now: Date = new Date()): Date {
  const reset = new Date(now.getFullYear(), now.getMonth(), FISCAL_RESET_DAY, 0, 0, 0, 0);
  if (now.getDate() >= FISCAL_RESET_DAY) {
    reset.setMonth(reset.getMonth() + 1);
  }
  return reset;
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function getResetCountdown(now: Date = new Date()): Countdown {
  const target = getNextResetDate(now);
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(totalMs / 86400000);
  const hours = Math.floor((totalMs % 86400000) / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  return { days, hours, minutes, seconds, totalMs };
}

/** Human-friendly short countdown, e.g. "12d 4h" or "3h 22m". */
export function formatCountdown(c: Countdown): string {
  if (c.days > 0) return `${c.days}d ${c.hours}h`;
  if (c.hours > 0) return `${c.hours}h ${c.minutes}m`;
  return `${c.minutes}m ${c.seconds}s`;
}
