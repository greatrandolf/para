/**
 * Web build of rewardedAds (ad-supported-live-view): there are no rewarded ads on web, and the Google Mobile Ads
 * package is native-only, so it must never be bundled for web (the web/server export fails on it). Under ₱1 the web
 * app shows "Top up to view live".
 */

export type AdOutcome = 'earned' | 'closed' | 'failed';

/** No native ads module on web. */
export function adsModule(): undefined {
  return undefined;
}

export const adsSupported = () => false;

export const usesTestAd = () => false;

export const confirmsRewardLocally = () => false;

export function showRewardedAd(_ssv: { userId: string; customData: string }): Promise<AdOutcome> {
  return Promise.resolve('failed');
}
