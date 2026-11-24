import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  signOut,
  type Auth,
} from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase, type Database } from 'firebase/database';
import { connectFirestoreEmulator, getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';

import { AUTH_EMULATOR_URL, EMULATOR_HOST, FIREBASE_CONFIG } from '@/constants/api';

const app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);

function createAuth(): Auth {
  // Web keeps the session in the browser.
  if (Platform.OS === 'web') return getAuth(app);
  // Native: keep the driver signed in across app restarts.
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app); // already initialized (fast refresh)
  }
}

export const auth = createAuth();

if (AUTH_EMULATOR_URL && !auth.emulatorConfig) {
  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
}

function createFirestore(): Firestore {
  try {
    // Long polling works on every React Native network stack (WebChannel streaming does not always).
    const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
    if (EMULATOR_HOST) connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
    return db;
  } catch {
    return getFirestore(app); // already initialized (fast refresh)
  }
}

/** Firestore, for live (onSnapshot) reads the security rules allow. Writes go through the backend. */
export const firestore = createFirestore();

let rtdb: Database | undefined;

/** The Realtime Database (live driver GPS). Throws when the build has no database URL. */
export function realtimeDb(): Database {
  if (rtdb) return rtdb;
  if (!FIREBASE_CONFIG.databaseURL) {
    throw new Error('Live tracking is not set up in this build (EXPO_PUBLIC_FIREBASE_DATABASE_URL).');
  }
  rtdb = getDatabase(app, FIREBASE_CONFIG.databaseURL);
  if (EMULATOR_HOST) {
    try {
      connectDatabaseEmulator(rtdb, EMULATOR_HOST, 9000);
    } catch {
      // already connected (fast refresh)
    }
  }
  return rtdb;
}

/** Errors meaning the saved session can never be refreshed (access turned off, phone replaced, emulator reset). */
const DEAD_SESSION = new Set([
  'auth/invalid-refresh-token',
  'auth/user-token-expired',
  'auth/user-not-found',
  'auth/user-disabled',
]);

export const isDeadSession = (error: unknown) => error instanceof FirebaseError && DEAD_SESSION.has(error.code);

/** The signed-in driver's ID token for backend calls. A session that can't be refreshed is signed out. */
export async function getIdToken(): Promise<string | null> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (error) {
    if (!isDeadSession(error)) throw error;
    await signOut(auth);
    return null;
  }
}
