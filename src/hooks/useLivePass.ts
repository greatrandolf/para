import { useEffect, useState } from 'react';

import { useOptionalSession } from '@/hooks/useSession';
import { useBuyView, useWallet, type ViewPass, type ViewPurchase } from '@packages/tanstack/query/views';

/** Price of one live view, in pesos (shown on buttons). The backend charges `config/earnings.priceCentavos`. */
export const LIVE_PASS_FARE = 1;

/** Whole minutes left until `until` (rounded up, "1 min left" until it ends); undefined when over. */
export function minutesLeftUntil(until: number | undefined, now = Date.now()): number | undefined {
  const left = (until ?? 0) - now;
  return left > 0 ? Math.ceil(left / 60_000) : undefined;
}

/**
 * Whether a running pass unlocks `routeCode`: a ₱1 pass unlocks every route, an ad pass only the route it was watched
 * for (ad-supported-live-view).
 */
export function passCoversRoute(pass: ViewPass | null | undefined, routeCode: string | null | undefined, now: number) {
  if (!pass || pass.until <= now) return false;
  if (!pass.routeCodes?.length) return true;
  return !!routeCode && pass.routeCodes.includes(routeCode);
}

export type BuyInput = { lat: number; lng: number; direction?: 'outbound' | 'inbound' };

export type LivePass = {
  /** Whether live jeepneys on the route are unlocked right now (₱1: every route on the way; an ad: its route only). */
  has: (routeCode?: string | null) => boolean;
  /** Whole minutes left on the pass, or undefined without one. */
  minutesLeft: (routeCode?: string | null) => number | undefined;
  /** The incoming jeepneys the pass shows (the ones that shared the ₱1). */
  driverIds: string[];
  /** Wallet balance in pesos, once loaded. */
  balance?: number;
  /** The balance covers a ₱1 view (ad-supported-live-view: under it, the app offers an ad instead). */
  canPay: boolean;
  /** Rewarded ads are on (backend setting), and the minutes a watched ad gives. */
  adsEnabled: boolean;
  adMinutes: number;
  /** A local business's Para Ad is running (para-ads): ads work even where Google's can't show. */
  paraAds: boolean;
  /** What the running pass came from: "paid" (₱1) or "ad". */
  passKind?: 'paid' | 'ad';
  /** The route codes an ad pass is limited to (undefined for ₱1 or no pass). */
  passRoutes?: string[];
  /** Reloads the wallet; true when a pass now unlocks the route (after an ad's reward). */
  refresh: (routeCode?: string | null) => Promise<boolean>;
  /** Buys ₱1 of live jeepneys for all routes on the way (charged only when some are coming). */
  buy: (input: BuyInput) => Promise<ViewPurchase>;
  buying: boolean;
};

/**
 * The commuter's ₱1 live pass, from the backend (shared-view-earnings): the wallet balance, the pass and which
 * jeepneys it shows. The ₱1 is shared by the jeepneys coming the commuter's way.
 */
export function useLivePass(): LivePass {
  const session = useOptionalSession();
  const wallet = useWallet(session?.status === 'commuter');
  const buyView = useBuyView();
  const pass = wallet.data?.pass ?? null;

  // Re-render every 15 s while a pass runs (minutes left) and right when it ends (the map locks again).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!pass || pass.until <= now) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.min(15_000, pass.until - now + 50));
    return () => clearTimeout(timer);
  }, [pass, now]);

  // `now` ticks only while a pass runs, so it can be old when a new pass arrives (that showed "4 min left" on a
  // 3-minute ad pass). A new pass comes with a fresh wallet fetch, so its fetch time is at least as recent.
  const at = Math.max(now, wallet.dataUpdatedAt ?? 0);
  const active = !!pass && pass.until > at;
  return {
    has: (code) => active && passCoversRoute(pass, code, at),
    minutesLeft: (code) => {
      if (!active || !passCoversRoute(pass, code, at)) return undefined;
      const left = minutesLeftUntil(pass?.until, at);
      // Right after a pass arrives the clock read can be a few seconds old: never show more than an ad pass lasts.
      return pass?.kind === 'ad' && left !== undefined ? Math.min(left, wallet.data?.ads?.passMinutes ?? 3) : left;
    },
    driverIds: active ? (pass?.driverIds ?? []) : [],
    balance: wallet.data ? wallet.data.balanceCentavos / 100 : undefined,
    // Until the wallet loads, assume ₱1 is fine (the backend checks again).
    canPay: !wallet.data || wallet.data.balanceCentavos >= (wallet.data.priceCentavos ?? 100),
    adsEnabled: wallet.data?.ads?.enabled === true,
    adMinutes: wallet.data?.ads?.passMinutes ?? 3,
    paraAds: wallet.data?.ads?.para === true,
    passKind: active ? (pass?.kind ?? 'paid') : undefined,
    passRoutes: active && pass?.routeCodes?.length ? pass.routeCodes : undefined,
    refresh: async (code) => {
      const fresh = await wallet.refetch();
      return passCoversRoute(fresh.data?.pass, code ?? fresh.data?.pass?.routeCodes?.[0], Date.now());
    },
    buy: (input) => buyView.mutateAsync(input),
    buying: buyView.isPending,
  };
}
