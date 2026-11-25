import type { LatLng } from 'react-native-maps';

import { distanceText } from './commuteOptions';
import { distanceM } from './livePath';

/**
 * waiting-pin: the commuter can pin where they will wait for the jeepney, anywhere on the map.
 * Everything that depends on "where the commuter boards" (the routes on the way, the boarding point, which jeeps are
 * coming, and the jeepneys that share the ₱1) then uses the pin instead of their GPS, so they can pay while still
 * walking there.
 */

/** Where the commuter waits: the pin when set, else their GPS. */
export const waitingPoint = (pin: LatLng | undefined, gps: LatLng | undefined): LatLng | undefined => pin ?? gps;

/** "Waiting pin • 350 m from you" (or without the distance when there is no GPS). */
export function pinLabel(pin: LatLng, gps: LatLng | undefined): string {
  if (!gps) return 'Waiting pin';
  const m = distanceM(gps, pin);
  return m < 20 ? 'Waiting pin • you are here' : `Waiting pin • ${distanceText(m)} from you`;
}
