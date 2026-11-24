/** Shapes returned by the para-backend view callables (shared-view-earnings). */

/** A live pass: all routes on the commuter's way, only these incoming jeepneys, until `until` (ms). */
export type ViewPass = {
  until: number;
  driverIds: string[];
  viewId: string;
  /** "paid" (₱1, 15 min) or "ad" (a watched rewarded ad, 3 min); missing on older passes (paid). */
  kind?: 'paid' | 'ad';
  /** The routes it unlocks: a watched ad unlocks only the picked route; a ₱1 pass (no list) unlocks every route. */
  routeIds?: string[];
  routeCodes?: string[];
};

/** `walletMe`: the commuter's balance (centavos) and live pass, the ₱1 price and the ads setting. */
export type Wallet = {
  balanceCentavos: number;
  pass: ViewPass | null;
  /** The ₱1 price in centavos (missing on older backends: 100). */
  priceCentavos?: number;
  /** The welcome credit can still be claimed with this phone (starter-credit-per-device). */
  starterEligible?: boolean;
  /** Rewarded ads for commuters under ₱1 (ad-supported-live-view); missing on older backends: off. */
  ads?: {
    enabled: boolean;
    passMinutes: number;
    /** A local business's Para Ad is running (para-ads): ads work without Google's (e.g. on web or Expo Go). */
    para?: boolean;
  };
};

/** `walletClaimStarter`: the welcome credit, given to the first account on a device. */
export type StarterClaim =
  | { credited: true; amountCentavos: number; balanceCentavos: number }
  | { credited: false; reason: 'not-eligible' | 'device-used'; balanceCentavos: number };

/** A Para Ad to show (para-ads): a local business's photo ad, open `minSeconds` before Continue. */
export type ParaAd = {
  campaignId: string;
  businessName: string;
  headline: string;
  imageUrl: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  minSeconds: number;
};

/** `adViewStart`: an ad view to show a rewarded ad for, or why not. */
export type AdViewStart =
  | {
      started: true;
      adViewId: string;
      passMinutes: number;
      /** Google AdMob, or a local business's Para Ad (para-ads; older backends: AdMob). */
      source?: 'admob' | 'para';
      para?: ParaAd;
    }
  | { started: false; reason: 'no-incoming' | 'active-pass' | 'cap' | 'off' | 'no-ad' };

/** `viewsPurchase`: charged only when jeepneys are coming and no pass is running. */
export type ViewPurchase = {
  charged: boolean;
  reason?: 'active-pass' | 'no-incoming';
  pass: ViewPass | null;
  incoming?: number;
};
