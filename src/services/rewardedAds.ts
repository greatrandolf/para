import { Alert, NativeModules, Platform, TurboModuleRegistry } from 'react-native';

import { USE_EMULATORS } from '@/constants/api';

/**
 * Google AdMob rewarded ads (ad-supported-live-view). The ads module is native: it is in new app builds only, not in
 * Expo Go or older APKs, so it is loaded only when present. The reward itself is confirmed to the backend by Google
 * (server-side verification): `userId` and `customData` (our ad view id) travel with it.
 *
 * Ad unit ids come from EXPO_PUBLIC_ADMOB_REWARDED_IOS / _ANDROID (set for the preview and production builds in
 * eas.json). Development builds always use Google's test unit (AdMob policy: never load your own live ads while
 * testing). A release build without a unit id for its platform shows no ads ("Top up to view live").
 */

export type AdOutcome = 'earned' | 'closed' | 'failed';

type AdsModule = typeof import('react-native-google-mobile-ads');

/** The native ads module, or undefined where it is not built in (Expo Go, web, older builds). */
export function adsModule(): AdsModule | undefined {
  if (Platform.OS === 'web') return undefined;
  const present =
    !!(TurboModuleRegistry.get?.('RNGoogleMobileAdsModule') ?? NativeModules.RNGoogleMobileAdsModule) ||
    !!NativeModules.RNGoogleMobileAdsRewardedModule;
  if (!present) return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-google-mobile-ads') as AdsModule;
  } catch {
    return undefined;
  }
}

/**
 * Whether this app can show an ad: real rewarded ads in a native build, or the test ad on the local emulators (so the
 * flow can be tried in Expo Go). Never on web.
 */
export const adsSupported = () =>
  Platform.OS !== 'web' && ((!!adsModule() && (__DEV__ || !!configuredUnitId())) || USE_EMULATORS);

/** True when the next ad will be the emulator's test ad, not a real one. */
export const usesTestAd = () => !adsModule() && USE_EMULATORS;

/**
 * Google never confirms test ads to the backend (its sample test unit has no verification URL), and on the local
 * emulators it can't reach the backend at all. So development builds (which always show Google's test ad) and the
 * emulators confirm a watched ad with the backend's test reward. Deployed backends accept it only from the ad testers
 * in `config/ads.testerUids`, and it pays drivers nothing. Release builds show real ads, confirmed by Google.
 */
export const confirmsRewardLocally = () => USE_EMULATORS || __DEV__;

/** This platform's rewarded ad unit from the build's env, if set. */
function configuredUnitId(): string | undefined {
  return (
    (Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS
      : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID) || undefined
  );
}

/** Google's test unit in development; the configured unit in release builds. */
const unitId = (mod: AdsModule) => (__DEV__ ? mod.TestIds.REWARDED : (configuredUnitId() ?? mod.TestIds.REWARDED));

/** How long to wait for an ad to load before giving up. */
const LOAD_TIMEOUT_MS = 15_000;

/**
 * Loads and shows one rewarded ad. "earned" when the commuter watched to the reward, "closed" when they left early,
 * "failed" when no ad could be shown. Non-personalized ads only (Data Privacy Act; no consent asked up front).
 */
export function showRewardedAd(ssv: { userId: string; customData: string }): Promise<AdOutcome> {
  const mod = adsModule();
  if (!mod) return usesTestAd() ? showTestAd() : Promise.resolve('failed');
  const { RewardedAd, RewardedAdEventType, AdEventType } = mod;
  const ad = RewardedAd.createForAdRequest(unitId(mod), {
    requestNonPersonalizedAdsOnly: true,
    serverSideVerificationOptions: ssv,
  });
  return new Promise<AdOutcome>((resolve) => {
    let earned = false;
    let done = false;
    const subs: (() => void)[] = [];
    const finish = (outcome: AdOutcome) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      subs.forEach((off) => off());
      resolve(outcome);
    };
    const timer = setTimeout(() => finish('failed'), LOAD_TIMEOUT_MS);
    subs.push(
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        clearTimeout(timer);
        ad.show().catch(() => finish('failed'));
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned ? 'earned' : 'closed')),
      ad.addAdEventListener(AdEventType.ERROR, () => finish('failed')),
    );
    ad.load();
  });
}

/** Local emulators only: a stand-in for a rewarded ad, since Expo Go has no ads module. */
function showTestAd(): Promise<AdOutcome> {
  return new Promise((resolve) =>
    Alert.alert(
      'Test ad (local emulator)',
      'A real rewarded ad plays here in the app build. Pretend you watched it to the end?',
      [
        { text: 'Close early', style: 'cancel', onPress: () => resolve('closed') },
        { text: 'Watched to the end', onPress: () => resolve('earned') },
      ],
      { cancelable: true, onDismiss: () => resolve('closed') },
    ),
  );
}
