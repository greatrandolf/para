import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Backend and Firebase settings (see para-backend/docs/deployment.md).
 *
 * Without EXPO_PUBLIC_FIREBASE_API_KEY the app uses the local Firebase emulators (Auth :9099, Functions :5001).
 */
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

/** True when no Firebase config is set: use the local emulators. */
export const USE_EMULATORS = !apiKey || process.env.EXPO_PUBLIC_USE_AUTH_EMULATOR === '1';

/**
 * Where the emulators run, as seen from the app:
 * - web and the iOS Simulator share the Mac's localhost; the Android emulator reaches it as 10.0.2.2;
 * - a physical phone uses the Mac's LAN address from Expo, and the emulators must listen on 0.0.0.0
 *   (see para-backend/docs/deployment.md).
 */
function emulatorHost(): string {
  const fromEnv = process.env.EXPO_PUBLIC_EMULATOR_HOST;
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'web') return '127.0.0.1';
  if (!Device.isDevice) return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  return devHost && devHost !== 'localhost' ? devHost : '127.0.0.1';
}

const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'para-a9efb';

export const FIREBASE_CONFIG = {
  apiKey: apiKey ?? 'local-emulator',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  // Realtime Database (live driver GPS). The emulator only uses the name before ".firebaseio.com".
  databaseURL:
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ??
    (USE_EMULATORS ? `https://${projectId}-default-rtdb.firebaseio.com` : undefined),
};

/** Host of the local emulators (Auth :9099, Firestore :8080, Realtime Database :9000), or undefined. */
export const EMULATOR_HOST = USE_EMULATORS ? emulatorHost() : undefined;

export const AUTH_EMULATOR_URL = EMULATOR_HOST ? `http://${EMULATOR_HOST}:9099` : undefined;

/** Base URL of the para-backend callable functions. */
export const FUNCTIONS_URL =
  process.env.EXPO_PUBLIC_FUNCTIONS_URL ?? `http://${emulatorHost()}:5001/${FIREBASE_CONFIG.projectId}/asia-southeast1`;
