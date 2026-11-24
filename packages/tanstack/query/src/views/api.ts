import type { FunctionsClient } from '../client';
import type { AdViewStart, StarterClaim, ViewPurchase, Wallet } from './types';
import type { StartWatchInput, StartWatchResult } from './watch';

/** Typed wrappers around the para-backend wallet and ₱1 view callables. */
export const viewsApi = (client: FunctionsClient) => ({
  wallet: (signal?: AbortSignal) => client.call<Wallet>('walletMe', {}, signal),
  /** ₱1 for live jeepneys on all routes on the way; the point is rounded to ~110 m. */
  purchase: (input: { lat: number; lng: number; direction?: 'outbound' | 'inbound' }) =>
    client.call<ViewPurchase>('viewsPurchase', {
      lat: Math.round(input.lat * 1000) / 1000,
      lng: Math.round(input.lng * 1000) / 1000,
      ...(input.direction ? { direction: input.direction } : {}),
    }),
  /**
   * Before a rewarded ad (ad-supported-live-view): notes the jeepneys coming the commuter's way on the picked route.
   * The pass (that route only) is granted by the backend once Google confirms the reward.
   */
  adViewStart: (input: { lat: number; lng: number; direction?: 'outbound' | 'inbound'; routeId?: string }) =>
    client.call<AdViewStart>('adViewStart', {
      lat: Math.round(input.lat * 1000) / 1000,
      lng: Math.round(input.lng * 1000) / 1000,
      ...(input.direction ? { direction: input.direction } : {}),
      // A watched ad unlocks only this route.
      ...(input.routeId ? { routeId: input.routeId } : {}),
    }),
  /**
   * The Para Ad was open for its minimum time (para-ads): the backend grants the route's pass and charges the
   * business one view.
   */
  paraAdViewed: (adViewId: string) =>
    client.call<{ result: 'granted' | 'credited' | 'duplicate'; charged: boolean }>('paraAdViewed', { adViewId }),
  /** The welcome credit for this phone (starter-credit-per-device); never given twice to a device or account. */
  claimStarter: (input: { platform: 'ios' | 'android'; deviceId: string }) =>
    client.call<StarterClaim>('walletClaimStarter', input),
  /** Local emulator only: stands in for Google's reward callback (no real ads in Expo Go). */
  adViewDevReward: (adViewId: string) => client.call<{ result: string }>('adViewDevReward', { adViewId }),
  /** Free: tell the commuter when a jeepney starts coming their way (30 min). */
  watch: (input: StartWatchInput) =>
    client.call<StartWatchResult>('viewsWatch', {
      lat: Math.round(input.lat * 1000) / 1000,
      lng: Math.round(input.lng * 1000) / 1000,
      ...(input.direction ? { direction: input.direction } : {}),
      ...(input.pushToken ? { pushToken: input.pushToken } : {}),
    }),
  cancelWatch: () => client.call<{ ok: boolean }>('viewsWatchCancel', {}),
});
