import Constants from 'expo-constants';
import { NativeModules, TurboModuleRegistry } from 'react-native';

import { USE_EMULATORS } from '@/constants/api';

/**
 * Google sign-in for commuters. The native Google SDK gives an ID token; Firebase signs in with it.
 *
 * The native module exists only in a development or store build (not in Expo Go), and needs the OAuth client IDs
 * from the Firebase project (read from the Google services files by app.config.ts).
 * Against the local Auth emulator, without the native module, a fixed test Google identity is used instead, so the
 * flow can be tried in Expo Go. That never happens with a real Firebase project.
 */

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

// app.config.ts reads both from the environment's Firebase files (configuration/google-services/<APP_ENV>/);
// EXPO_PUBLIC_* variables override them.
const fromConfig = (Constants.expoConfig?.extra?.google ?? {}) as Record<string, unknown>;
const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined);
const WEB_CLIENT_ID = text(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) ?? text(fromConfig.webClientId);
const IOS_CLIENT_ID = text(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) ?? text(fromConfig.iosClientId);

/** The test identity the Auth emulator accepts as an unsigned Google ID token. */
export const EMULATOR_GOOGLE_USER = {
  sub: 'emulator-google-commuter',
  email: 'google.commuter@para.test',
  email_verified: true,
  name: 'Google Test Commuter',
};

let cached: GoogleModule | null | undefined;

/** The native Google Sign-In module, or null in Expo Go / tests (where it isn't linked). */
function nativeGoogle(): GoogleModule | null {
  if (cached !== undefined) return cached;
  // Check before loading: the library throws while loading when its native module is missing (Expo Go), and React
  // Native reports that as a fatal error even when it is caught.
  const linked = TurboModuleRegistry.get('RNGoogleSignin') ?? NativeModules.RNGoogleSignin;
  if (!linked) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-google-signin/google-signin') as GoogleModule;
    mod.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, iosClientId: IOS_CLIENT_ID });
    cached = mod;
  } catch {
    cached = null;
  }
  return cached;
}

/**
 * - `native`: the real Google account picker.
 * - `emulator`: local development without the native module; signs in as EMULATOR_GOOGLE_USER.
 * - `unavailable`: not set up (no client ID, or Expo Go against a real project). The button is hidden.
 */
export type GoogleSignInMode = 'native' | 'emulator' | 'unavailable';

export function googleSignInMode(): GoogleSignInMode {
  if (WEB_CLIENT_ID && nativeGoogle()) return 'native';
  if (USE_EMULATORS) return 'emulator';
  return 'unavailable';
}

/** Shows Google's account picker. Returns the ID token, or null if the user cancelled. */
export async function getGoogleIdToken(): Promise<string | null> {
  const mode = googleSignInMode();
  if (mode === 'emulator') return JSON.stringify(EMULATOR_GOOGLE_USER);
  const google = nativeGoogle();
  if (mode !== 'native' || !google) throw new Error('Google sign-in is not set up in this build.');

  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = google;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null; // cancelled
    if (!response.data.idToken) throw new Error('Google did not return an ID token. Check the web client ID.');
    return response.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.IN_PROGRESS) return null;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play services is missing or out of date on this phone.');
      }
    }
    throw error;
  }
}

/** Forgets the Google account, so the picker shows again at the next sign-in. */
export async function signOutGoogle(): Promise<void> {
  const google = nativeGoogle();
  if (googleSignInMode() !== 'native' || !google) return;
  await google.GoogleSignin.signOut().catch(() => undefined);
}
