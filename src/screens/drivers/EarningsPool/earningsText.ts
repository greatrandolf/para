import type { DriverPayout } from '@packages/tanstack/query/driver';
import { formatPeso } from '@/utils/currency';

/** Micro-pesos (₱1 = 1,000,000) as pesos with centavos: day and unit totals. */
export const microPeso = (micro: number) => formatPeso(Math.floor(micro / 10_000) / 100);

/** Micro-pesos exactly: "₱0.30", or "₱0.0750" for shares under a centavo (one ₱1 view's part). */
export const exactPeso = (micro: number) =>
  micro % 10_000 === 0 ? formatPeso(micro / 1_000_000) : `₱${(micro / 1_000_000).toFixed(4)}`;

const DAY_MS = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const at = (day: string) => Date.parse(`${day}T00:00:00Z`);

export type PeriodKey = 'week' | 'lastWeek' | 'month';

export const PERIODS: readonly { value: PeriodKey; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'lastWeek', label: 'Last week' },
  { value: 'month', label: 'This month' },
];

/** The Manila days a period covers, up to today (weeks run Monday to Sunday). */
export function periodRange(key: PeriodKey, today: string): { from: string; to: string } {
  const t = at(today);
  const monday = t - ((new Date(t).getUTCDay() + 6) % 7) * DAY_MS;
  if (key === 'week') return { from: iso(monday), to: today };
  if (key === 'lastWeek') return { from: iso(monday - 7 * DAY_MS), to: iso(monday - DAY_MS) };
  return { from: `${today.slice(0, 8)}01`, to: today };
}

const DAY_LABEL = new Intl.DateTimeFormat('en-PH', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/** "Today", "Yesterday", or "Mon, Nov 16". */
export function dayLabel(day: string, today: string): string {
  if (day === today) return 'Today';
  if (at(today) - at(day) === DAY_MS) return 'Yesterday';
  return DAY_LABEL.format(new Date(at(day)));
}

/** "9:42 AM" in Manila. */
export const timeText = (ms: number) =>
  new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }).format(
    new Date(ms),
  );

/** "shared with 2 jeepneys" / "only your jeepney". */
export const sharedText = (n: number) => (n <= 1 ? 'only your jeepney' : `shared by ${n} jeepneys`);

/**
 * The payouts a day belongs to (a mid-week request can split a day in two), with how they read to the driver.
 */
export function payoutsForDay(payouts: readonly DriverPayout[], day: string): { label: string; paid: boolean }[] {
  return payouts
    .filter((p) => p.periodStart <= day && day <= p.periodEnd)
    .map((p) => ({
      paid: p.status === 'paid',
      label:
        p.status === 'paid'
          ? `Paid${p.receiptNo ? ` • ${p.receiptNo}` : ''}`
          : p.status === 'carried'
            ? 'Carried over'
            : 'Payout pending',
    }));
}
