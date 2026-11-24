import { Alert } from 'react-native';
import type { LatLng } from 'react-native-maps';

import type { JeepWatchState } from '@/hooks/useJeepWatch';
import type { LivePass } from '@/hooks/useLivePass';

/**
 * Buys ₱1 of live jeepneys for all routes on the commuter's way and tells them the outcome (shared-view-earnings).
 * Returns true when they now have live access.
 */
export async function buyLiveView(
  pass: LivePass,
  me: LatLng | undefined,
  direction?: 'outbound' | 'inbound',
  watch?: JeepWatchState,
): Promise<boolean> {
  if (!me) {
    Alert.alert('Location needed', 'Turn on location, or set a waiting pin on the map, so Para can find the jeepneys coming your way.');
    return false;
  }
  try {
    const result = await pass.buy({ lat: me.latitude, lng: me.longitude, direction });
    if (result.charged) return true;
    if (result.reason === 'active-pass') return true;
    noJeepneysComing(me, direction, watch, 'You were not charged.');
    return false;
  } catch (e) {
    Alert.alert('Could not open live view', e instanceof Error ? e.message : 'Please try again.');
    return false;
  }
}

/**
 * "No jeepneys coming yet", offering the free "Notify me" watch when available (jeep-coming-alert). Shared by the ₱1
 * purchase and rewarded ads.
 */
export function noJeepneysComing(
  me: LatLng,
  direction: 'outbound' | 'inbound' | undefined,
  watch: JeepWatchState | undefined,
  outcome: string,
) {
  const text = `No jeepney is moving towards your stop right now. ${outcome}`;
  if (!watch) {
    Alert.alert('No jeepneys coming yet', text);
    return;
  }
  // jeep-coming-alert: offer a free watch instead of a dead end.
  Alert.alert('No jeepneys coming yet', `${text}\n\nWant us to tell you when one is coming? It's free.`, [
    { text: 'Not now', style: 'cancel' },
    {
      text: 'Notify me — free',
      onPress: () => void startWatch(watch, { lat: me.latitude, lng: me.longitude, direction }),
    },
  ]);
}

/** Starts the free watch and says how the commuter will be told. */
async function startWatch(watch: JeepWatchState, input: Parameters<JeepWatchState['start']>[0]) {
  try {
    const { push } = await watch.start(input);
    if (!push) {
      Alert.alert(
        'Watching for jeepneys',
        "We'll show it here in the app for the next 30 minutes. Turn on notifications for Para to get an alert when the app is closed.",
      );
    }
  } catch (e) {
    Alert.alert('Could not start watching', e instanceof Error ? e.message : 'Please try again.');
  }
}
