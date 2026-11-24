import { Alert } from 'react-native';
import type { LatLng } from 'react-native-maps';

import { noJeepneysComing } from '@/hooks/buyLiveView';
import type { JeepWatchState } from '@/hooks/useJeepWatch';
import type { LivePass } from '@/hooks/useLivePass';
import { showParaAd } from '@/services/paraAdPresenter';
import { adsSupported, confirmsRewardLocally, showRewardedAd } from '@/services/rewardedAds';
import type { AdViewStart } from '@packages/tanstack/query/views';

export type AdApi = {
  adViewStart: (input: {
    lat: number;
    lng: number;
    direction?: 'outbound' | 'inbound';
    routeId?: string;
  }) => Promise<AdViewStart>;
  adViewDevReward: (adViewId: string) => Promise<{ result: string }>;
  paraAdViewed: (adViewId: string) => Promise<{ result: string; charged: boolean }>;
};

/** How long to wait for Google's reward confirmation to reach the backend. */
const UNLOCK_WAIT_MS = 10_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Live jeepneys for a watched ad (ad-supported-live-view), for commuters under ₱1. The backend notes the jeepneys
 * coming their way on the picked route, the commuter watches a rewarded ad, and Google confirms the reward to the
 * backend, which grants a short pass for that route only (₱1 still unlocks every route). No pop-up asks them to top
 * up. Returns true when live view on the route is now unlocked.
 */
export async function watchAdForLiveView(
  api: AdApi,
  pass: LivePass,
  uid: string | undefined,
  me: LatLng | undefined,
  direction?: 'outbound' | 'inbound',
  watch?: JeepWatchState,
  route?: { id: string; code: string },
): Promise<boolean> {
  if (!me || !uid) {
    Alert.alert('Location needed', 'Turn on location, or set a waiting pin on the map, so Para can find the jeepneys coming your way.');
    return false;
  }
  try {
    const start = await api.adViewStart({ lat: me.latitude, lng: me.longitude, direction, routeId: route?.id });
    if (!start.started) {
      if (start.reason === 'active-pass') return pass.refresh(route?.code);
      if (start.reason === 'no-incoming') {
        noJeepneysComing(me, direction, watch, 'No ad needed.');
        return false;
      }
      Alert.alert('Ads not available', 'Live view by ads is not available right now. Top up ₱1 to view live.');
      return false;
    }
    // para-ads: a local business's Para Ad when one is running; the backend unlocks the route once it was open
    // long enough (it checks the time too).
    if (start.source === 'para' && start.para) {
      if ((await showParaAd(start.para, start.passMinutes)) === 'closed') return false;
      await api.paraAdViewed(start.adViewId);
      return pass.refresh(route?.code);
    }
    if (!adsSupported()) {
      Alert.alert('No ad available right now', 'Please try again in a moment, or top up ₱1 to view live.');
      return false;
    }
    const outcome = await showRewardedAd({ userId: uid, customData: start.adViewId });
    if (outcome === 'closed') return false;
    if (outcome === 'failed') {
      Alert.alert('No ad available right now', 'Please try again in a moment.');
      return false;
    }
    // Local emulators: Google's confirmation cannot reach localhost; the backend's test reward stands in for it.
    if (confirmsRewardLocally()) {
      try {
        await api.adViewDevReward(start.adViewId);
      } catch (e) {
        Alert.alert(
          'Test ad not counted',
          e instanceof Error && /tester/.test(e.message)
            ? 'Google test ads unlock live view only for ad tester accounts (config/ads.testerUids).'
            : 'Please try again.',
        );
        return false;
      }
    }
    const until = Date.now() + UNLOCK_WAIT_MS;
    while (Date.now() < until) {
      if (await pass.refresh(route?.code)) return true;
      await sleep(1000);
    }
    Alert.alert('The ad did not count', 'Please try again. You were not charged.');
    return false;
  } catch (e) {
    Alert.alert('Could not open live view', e instanceof Error ? e.message : 'Please try again.');
    return false;
  }
}
