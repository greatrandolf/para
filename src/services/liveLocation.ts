import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ref, serverTimestamp, set, type DatabaseReference } from 'firebase/database';
import { Alert, Platform } from 'react-native';

import { colors } from '@/constants/theme';
import { realtimeDb } from '@/services/firebase';

/**
 * Live GPS for drivers in service: the phone's position goes to the Realtime Database at
 * `driverLocations/{driverId}/position` (see para-backend/database.rules.json).
 *
 * With the "Always" permission (driver-background-gps), positions come from a background location task, so they keep
 * coming with the phone locked or Para in the background (Android shows a notification while it runs). Without it,
 * positions are sent only while the app is open.
 */

/** Send at most every few seconds, or when the jeepney moved this far. */
export const SEND_EVERY_MS = 5_000;
export const SEND_EVERY_M = 10;
/** A parked jeepney (no movement, so no new fixes) still re-sends its position this often, so it stays live. */
export const HEARTBEAT_MS = 30_000;

export type LivePosition = {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
};

const inRange = (value: number | null | undefined, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : undefined;

/** The fields the database rules accept. Missing or out-of-range readings are left out. */
export function toLivePosition(coords: Location.LocationObjectCoords): LivePosition {
  const out: LivePosition = { lat: coords.latitude, lng: coords.longitude };
  const heading = inRange(coords.heading, 0, 360);
  const speed = inRange(coords.speed, 0, 100);
  const accuracy = inRange(coords.accuracy, 0, 100_000);
  if (heading !== undefined) out.heading = heading;
  if (speed !== undefined) out.speed = speed;
  if (accuracy !== undefined) out.accuracy = accuracy;
  return out;
}

/** The background location task (driver-background-gps). */
export const DRIVER_LOCATION_TASK = 'para-driver-location';
/** The driver the background task sends for, kept for when Android runs the task without the app's screens. */
const TASK_DRIVER_KEY = 'para.backgroundGps.driverId';
/** Set once the driver answered the "keep sharing when locked" question, so it is asked only once. */
export const BACKGROUND_ASKED_KEY = 'para.backgroundGps.asked';

/** While tracking runs in the app, the task hands its fixes here (same throttle and "Last sent"). */
let activeSend: ((coords: Location.LocationObjectCoords) => void) | undefined;

/**
 * expo-task-manager, when this build has its native module. Builds made before driver-background-gps do not: loading
 * it there throws, so those builds (and OTA updates to them) keep foreground-only GPS instead of crashing.
 */
function loadTaskManager(): typeof import('expo-task-manager') | undefined {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-task-manager') as typeof import('expo-task-manager');
  } catch {
    return undefined;
  }
}
const TaskManager = loadTaskManager();
const backgroundSupported = () => !!TaskManager;

// Defined when this module loads (the root layout imports it), as expo-task-manager requires.
if (TaskManager && !TaskManager.isTaskDefined(DRIVER_LOCATION_TASK)) {
  TaskManager.defineTask<{ locations?: Location.LocationObject[] }>(DRIVER_LOCATION_TASK, async ({ data, error }) => {
    const last = error ? undefined : data?.locations?.at(-1);
    if (!last) return;
    if (activeSend) {
      activeSend(last.coords);
      return;
    }
    // Android ran the task without the app's screens: send for the saved driver, or stop when there is none.
    const driverId = await AsyncStorage.getItem(TASK_DRIVER_KEY).catch(() => null);
    if (!driverId) {
      await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(() => undefined);
      return;
    }
    await set(ref(realtimeDb(), `driverLocations/${driverId}/position`), {
      ...toLivePosition(last.coords),
      at: serverTimestamp(),
    }).catch(() => undefined);
  });
}

/** Google Play asks for a clear explanation before the background location prompt. Resolves true on Allow. */
function askToKeepSharing(): Promise<boolean> {
  return new Promise((resolve) =>
    Alert.alert(
      'Keep sharing when the phone is locked?',
      "So commuters don't lose your jeepney, Para keeps sending its location while you are in service, even with " +
        'the screen locked or another app open. It stops when you go on break or sign out.' +
        (Platform.OS === 'ios'
          ? '\n\nNext, choose "Change to Always Allow".'
          : '\n\nNext, choose "Allow all the time".'),
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Allow', onPress: () => resolve(true) },
      ],
      { cancelable: false },
    ),
  );
}

/**
 * Whether background GPS can run: "Always" already allowed, or allowed now after the one-time explanation. Never asks
 * twice, and never asks where the system will not show the prompt again.
 */
export async function backgroundAllowed(): Promise<boolean> {
  if (!backgroundSupported()) return false;
  const current = await Location.getBackgroundPermissionsAsync();
  if (current.status === 'granted') return true;
  if (!current.canAskAgain) return false;
  if (await AsyncStorage.getItem(BACKGROUND_ASKED_KEY).catch(() => null)) return false;
  await AsyncStorage.setItem(BACKGROUND_ASKED_KEY, '1').catch(() => undefined);
  if (!(await askToKeepSharing())) return false;
  return (await Location.requestBackgroundPermissionsAsync()).status === 'granted';
}

/** Stops the background task if it runs (break, no assignment, sign-out). */
export async function stopBackgroundTracking(): Promise<void> {
  activeSend = undefined;
  await AsyncStorage.removeItem(TASK_DRIVER_KEY).catch(() => undefined);
  if (!backgroundSupported()) return;
  const started = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(() => false);
  if (started) await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(() => undefined);
}

export type TrackingState =
  | { state: 'off' }
  | { state: 'starting' }
  /** `background`: positions keep coming with the phone locked (driver-background-gps). */
  | { state: 'live'; lastSentAt?: number; error?: string; background?: boolean }
  | { state: 'denied'; message: string }
  | { state: 'error'; message: string };

/**
 * Starts sending this phone's position. Calls `onState` as tracking starts, sends, or fails.
 * Returns a function that stops it.
 */
export function startLiveTracking(driverId: string, onState: (state: TrackingState) => void): () => void {
  let stopped = false;
  let subscription: Location.LocationSubscription | undefined;
  let positionRef: DatabaseReference | undefined;
  let lastSentAt = 0;
  let lastCoords: Location.LocationObjectCoords | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let background = false;

  const send = async (coords: Location.LocationObjectCoords) => {
    lastCoords = coords;
    if (stopped || !positionRef) return;
    const now = Date.now();
    if (now - lastSentAt < SEND_EVERY_MS) return;
    lastSentAt = now;
    try {
      await set(positionRef, { ...toLivePosition(coords), at: serverTimestamp() });
      if (!stopped) onState({ state: 'live', lastSentAt: now, background });
    } catch {
      // Usually the server is still switching the duty status; the next position tries again.
      if (!stopped)
        onState({ state: 'live', lastSentAt: undefined, error: 'Waiting for the server to start tracking…', background });
    }
  };

  void (async () => {
    onState({ state: 'starting' });
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (stopped) return;
      if (permission.status !== 'granted') {
        onState({
          state: 'denied',
          message: 'Allow location for Para in Settings so your fleet and commuters can see your jeepney.',
        });
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        onState({ state: 'error', message: 'Turn on Location Services to share your live location.' });
        return;
      }
      // The last position stays when the app disconnects; presence (services/presence.ts) marks it offline.
      positionRef = ref(realtimeDb(), `driverLocations/${driverId}/position`);
      background = await backgroundAllowed().catch(() => false);
      if (stopped) return;
      if (background) {
        // The task delivers fixes in the foreground too, so it replaces the in-app watch.
        await AsyncStorage.setItem(TASK_DRIVER_KEY, driverId).catch(() => undefined);
        activeSend = (coords) => void send(coords);
        await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
          accuracy: Location.Accuracy.High,
          timeInterval: SEND_EVERY_MS,
          distanceInterval: SEND_EVERY_M,
          activityType: Location.ActivityType.AutomotiveNavigation,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "Para is sharing your jeepney's location",
            notificationBody: 'Your fleet and commuters can see your jeepney while you are in service.',
            notificationColor: colors.brand,
            killServiceOnDestroy: true,
          },
        });
        if (stopped) {
          void stopBackgroundTracking();
          return;
        }
      } else {
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: SEND_EVERY_MS, distanceInterval: SEND_EVERY_M },
          (location) => void send(location.coords),
          (reason) => onState({ state: 'error', message: reason || 'Location is not available.' }),
        );
        if (stopped) {
          sub.remove();
          return;
        }
        subscription = sub;
      }
      heartbeat = setInterval(() => {
        if (lastCoords && Date.now() - lastSentAt >= HEARTBEAT_MS) void send(lastCoords);
      }, HEARTBEAT_MS / 3);
      onState({ state: 'live', background });
      // Send the first position right away instead of waiting for movement.
      const current = await Location.getLastKnownPositionAsync().catch(() => null);
      if (current) void send(current.coords);
    } catch (error) {
      if (!stopped) {
        onState({ state: 'error', message: error instanceof Error ? error.message : 'Live tracking could not start.' });
      }
    }
  })();

  return () => {
    stopped = true;
    subscription?.remove();
    if (background) void stopBackgroundTracking();
    if (heartbeat) clearInterval(heartbeat);
    onState({ state: 'off' });
  };
}
