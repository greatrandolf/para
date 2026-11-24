import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LatLng } from 'react-native-maps';

/**
 * The commuter's own location, for the Live Map (their dot and nearest stop). It stays on the phone: it is never
 * sent to the backend or stored.
 *
 * - `pending`: asking for permission or waiting for the first fix;
 * - `granted`: `coordinate` is set and updates as they walk;
 * - `denied`: permission refused (the map works without it);
 * - `off`: Location Services are turned off.
 */
export type CommuterLocation =
  | { status: 'pending' }
  | { status: 'granted'; coordinate: LatLng; accuracy?: number }
  | { status: 'denied' }
  | { status: 'off' };

/** A walking commuter: an update every 10 s or 15 m is plenty, and easy on the battery. */
const WATCH = { accuracy: Location.Accuracy.Balanced, timeInterval: 10_000, distanceInterval: 15 };

export function useCommuterLocation(): CommuterLocation & { retry: () => void } {
  const [state, setState] = useState<CommuterLocation>({ status: 'pending' });
  const [attempt, setAttempt] = useState(0);
  const subscription = useRef<Location.LocationSubscription | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (permission.status !== 'granted') {
          setState({ status: 'denied' });
          return;
        }
        if (!(await Location.hasServicesEnabledAsync())) {
          if (!cancelled) setState({ status: 'off' });
          return;
        }
        const show = (l: Location.LocationObject) =>
          setState({
            status: 'granted',
            coordinate: { latitude: l.coords.latitude, longitude: l.coords.longitude },
            accuracy: l.coords.accuracy ?? undefined,
          });
        // A quick first answer, then live updates.
        const last = await Location.getLastKnownPositionAsync().catch(() => null);
        if (last && !cancelled) show(last);
        const sub = await Location.watchPositionAsync(WATCH, (l) => !cancelled && show(l));
        if (cancelled) sub.remove();
        else subscription.current = sub;
      } catch {
        if (!cancelled) setState({ status: 'off' });
      }
    })();
    return () => {
      cancelled = true;
      subscription.current?.remove();
      subscription.current = undefined;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
