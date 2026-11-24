import type { FunctionsClient } from '../client';
import type {
  ConfirmPayoutInput,
  DriverActivationResult,
  DriverDuty,
  DriverMe,
  DriverPayout,
  EarningsDayPage,
  EarningsSummary,
  PayBalance,
} from './types';

/** Typed wrappers around the para-backend driver app callables. */
export const driverApi = (client: FunctionsClient) => ({
  /** No sign-in needed: exchanges a one-time activation code (or the whole `para://activate?code=` link). */
  activate: (code: string) => client.call<DriverActivationResult>('driverAccessActivate', { code }),
  me: (signal?: AbortSignal) => client.call<DriverMe>('driverMe', {}, signal),
  /** Start or Resume Tracking (`in_service`), or Stop Tracking (`on_break`). */
  setDuty: (status: 'in_service' | 'on_break') => client.call<DriverDuty>('driverDutySet', { status }),
  /** End Shift & Submit Daily Manifest: completes the ongoing assignment (rotated). */
  endShift: () => client.call<DriverDuty>('driverShiftEnd', {}),
  /** What the driver earned per day and per unit, `from`–`to` (Manila days, at most 62, within 90 days). */
  earningsSummary: (range: { from: string; to: string }, signal?: AbortSignal) =>
    client.call<EarningsSummary>('driverEarningsSummary', range, signal),
  /** One day's units and the ₱1 views that paid the driver, 50 at a time. */
  earningsDay: (input: { day: string; cursor?: string }, signal?: AbortSignal) =>
    client.call<EarningsDayPage>('driverEarningsDay', input, signal),
  /** What the driver is still owed: not paid yet, across days (driver-pay-balance). */
  payBalance: (signal?: AbortSignal) => client.call<PayBalance>('driverPayBalance', {}, signal),
  /** Weekly payouts from the driver's fleet, latest first. */
  payouts: async (signal?: AbortSignal) =>
    (await client.call<{ payouts: DriverPayout[] }>('payoutsMine', {}, signal)).payouts,
  /** "I received it" or "Report a problem" on a paid payout. */
  confirmPayout: async (input: ConfirmPayoutInput) =>
    (await client.call<{ payout: DriverPayout }>('payoutConfirm', input)).payout,
  /** A 10-minute URL to the receipt PDF (opens in the phone's browser). */
  receiptUrl: async (payoutId: string) => {
    const { token } = await client.call<{ token: string }>('documentLink', { kind: 'receipt', id: payoutId });
    return `${client.baseUrl}/documentPdf?t=${encodeURIComponent(token)}`;
  },
});
