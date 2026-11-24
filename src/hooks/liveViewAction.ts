/**
 * Which "view live" button the commuter gets (ad-supported-live-view):
 * - "none": no jeepney is live on the route (₱0 guarantee, nothing to pay or watch);
 * - "pay": ₱1 or more in the wallet → View live jeepneys (₱1), 15 minutes;
 * - "ad": under ₱1 and ads can play → View live jeepneys (Watch Ads), a few minutes per ad;
 * - "topup": under ₱1 and no ads here (web, older app, ads off) → Top up to view live (opens the Wallet).
 */
export type LiveViewAction = 'none' | 'pay' | 'ad' | 'topup';

export function liveViewAction(input: { hasJeeps: boolean; canPay: boolean; adsAvailable: boolean }): LiveViewAction {
  if (!input.hasJeeps) return 'none';
  if (input.canPay) return 'pay';
  return input.adsAvailable ? 'ad' : 'topup';
}
