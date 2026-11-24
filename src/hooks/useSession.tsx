import { useQueryClient } from '@tanstack/react-query';
import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { onValue, ref } from 'firebase/database';

import { auth, isDeadSession, realtimeDb } from '@/services/firebase';
import { getGoogleIdToken, signOutGoogle } from '@/services/googleSignIn';
import { checkPin, clearPin, hasPin, savePin } from '@/services/pinStore';
import { useDriverApi } from '@packages/tanstack/query/driver';

/** How long the app may sit in the background before a driver must enter the PIN again. */
const RELOCK_AFTER_MS = 2 * 60 * 1000;

/**
 * - `setup`: activated on this phone, no PIN yet.
 * - `locked`: PIN set; ask for it (on every app start, and after RELOCK_AFTER_MS in the background).
 * - `unlocked`: the driver app is open.
 */
export type PinState = 'setup' | 'locked' | 'unlocked';

/**
 * Who is using the app on this phone:
 * - a **commuter**, signed in with email and password;
 * - a **driver**, activated with a one-time code from their fleet and unlocked with a PIN.
 */
export type SessionState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'commuter'; user: User }
  | {
      status: 'driver';
      user: User;
      driverId: string;
      pin: PinState;
      /** This phone's session from activation (one phone at a time); missing on older sign-ins or offline starts. */
      phoneSession?: string;
    };

type SessionValue = SessionState & {
  /** Why the phone was signed out (access turned off, too many wrong PINs), shown on the activation screen. */
  notice?: string;
  /** Commuter sign-in with email and password. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Commuter sign-in with a Google account. Resolves false if the user closed Google's picker. */
  signInWithGoogle: () => Promise<boolean>;
  /** Creates a commuter account and signs it in. */
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  /** Sends a password reset email to a commuter. */
  resetPassword: (email: string) => Promise<void>;
  /** Exchanges a driver activation code or link for a sign-in on this phone. */
  activate: (code: string) => Promise<{ driverName: string }>;
  /** Sets (or changes) this phone's driver PIN. */
  createPin: (pin: string) => Promise<void>;
  /** Unlocks the driver app with the PIN. After too many wrong tries the phone is signed out. */
  unlock: (pin: string) => Promise<{ ok: boolean; attemptsLeft: number }>;
  /** Locks the driver app (e.g. at the end of a shift); the PIN opens it again. */
  lock: () => void;
  /** Signs out (commuter or driver) and forgets this phone's PIN. */
  signOutPhone: (notice?: string) => Promise<void>;
  /**
   * Refreshes the sign-in token. False only when the session is dead (access turned off, account disabled or
   * deleted, activated on another phone); a network problem counts as still signed in.
   */
  refreshAccess: () => Promise<boolean>;
};

const SessionContext = createContext<SessionValue | null>(null);

/** Driver sign-ins are the Auth users `driver-<driverId>` (see para-backend driverAuthUid). */
const DRIVER_UID_PREFIX = 'driver-';
export const driverIdOf = (uid: string) =>
  uid.startsWith(DRIVER_UID_PREFIX) ? uid.slice(DRIVER_UID_PREFIX.length) || undefined : undefined;

/**
 * One driver, one phone. `current` is the driver's active phone session on the server (null once access is turned
 * off); `mine` is this phone's. Returns why this phone must sign out, or undefined while it is still the active one.
 */
export function phoneSessionEnded(current: string | null, mine: string): string | undefined {
  if (current === mine) return undefined;
  return current
    ? 'Para was activated on another phone, so this phone was signed out. Ask your fleet for a new activation code to use it here.'
    : 'Your app access was turned off. Ask your fleet for a new activation code.';
}

/** Friendly text for Firebase Auth errors on the commuter sign-in and sign-up screens. */
export function authErrorMessage(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'The email or password is incorrect.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead.';
    case 'auth/weak-password':
      return 'Choose a stronger password.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'This email already has a Para account. Sign in with your email and password.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not turned on for this Firebase project yet.';
    case 'auth/network-request-failed':
      return 'Cannot reach the sign-in service. Check your connection.';
    default:
      return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [notice, setNotice] = useState<string>();
  const api = useDriverApi();
  const queryClient = useQueryClient();
  const backgroundAt = useRef<number | null>(null);

  const signOutPhone = async (message?: string) => {
    setNotice(message);
    await signOutGoogle();
    await clearPin();
    await signOut(auth);
    queryClient.clear();
  };

  // Fires on sign-in, sign-out, and token refreshes. A driver's PIN state is only worked out when the user
  // changes, so a token refresh never re-locks the app.
  useEffect(
    () =>
      onIdTokenChanged(auth, async (user) => {
        if (!user) {
          setState({ status: 'signedOut' });
          return;
        }
        const showDriver = async (driverId: string, phoneSession?: string) => {
          const pin: PinState = (await hasPin(user.uid)) ? 'locked' : 'setup';
          setState((current) =>
            current.status === 'driver' && current.user.uid === user.uid
              ? { ...current, user, phoneSession: phoneSession ?? current.phoneSession }
              : { status: 'driver', user, driverId, pin, phoneSession },
          );
        };
        try {
          const { claims } = await user.getIdTokenResult();
          if (claims.role === 'driver' && typeof claims.driverId === 'string') {
            await showDriver(
              claims.driverId,
              typeof claims.phoneSession === 'string' ? claims.phoneSession : undefined,
            );
          } else {
            setState({ status: 'commuter', user });
          }
        } catch (error) {
          if (isDeadSession(error)) {
            // Access turned off, driver deleted, or activated on another phone: only then activate again.
            await signOutPhone('This phone was signed out. Ask your fleet for a new activation code.');
            return;
          }
          // Offline or the server is unreachable: the phone is still signed in. Keep it that way (a driver gets the
          // PIN screen, not activation); the next token refresh confirms access.
          const driverId = driverIdOf(user.uid);
          if (driverId) await showDriver(driverId);
          else setState({ status: 'commuter', user });
        }
      }),
    // signOutPhone only uses stable setters and module singletons.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // One driver, one phone: when the driver is activated on another phone (or the fleet turns access off), this
  // phone's session is replaced (or removed) and it signs out at once, back to the sign-in screen.
  const driverId = state.status === 'driver' ? state.driverId : undefined;
  const phoneSession = state.status === 'driver' ? state.phoneSession : undefined;
  useEffect(() => {
    if (!driverId || !phoneSession) return; // older sign-in: the backend still refuses it once replaced
    let db;
    try {
      db = realtimeDb();
    } catch {
      return; // live tracking not set up in this build
    }
    let signingOut = false;
    return onValue(
      ref(db, `driverSessions/${driverId}/sessionId`),
      (snap) => {
        const notice = phoneSessionEnded(snap.val() as string | null, phoneSession);
        if (!notice || signingOut) return;
        signingOut = true;
        void signOutPhone(notice);
      },
      () => undefined, // no access to read it (e.g. already signed out): the backend decides
    );
    // signOutPhone only uses stable setters and module singletons.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId, phoneSession]);

  // Ask drivers for the PIN again when the app comes back after a while.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') backgroundAt.current = Date.now();
      if (next === 'active' && backgroundAt.current && Date.now() - backgroundAt.current > RELOCK_AFTER_MS) {
        setState((current) =>
          current.status === 'driver' && current.pin === 'unlocked' ? { ...current, pin: 'locked' } : current,
        );
      }
      if (next === 'active') backgroundAt.current = null;
    });
    return () => sub.remove();
  }, []);

  const value: SessionValue = {
    ...state,
    notice,
    signIn: async (email, password) => {
      setNotice(undefined);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },
    signInWithGoogle: async () => {
      setNotice(undefined);
      const idToken = await getGoogleIdToken();
      if (!idToken) return false;
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      return true;
    },
    signUp: async ({ name, email, password }) => {
      setNotice(undefined);
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, { displayName: name.trim() });
      setState({ status: 'commuter', user });
    },
    resetPassword: async (email) => {
      await sendPasswordResetEmail(auth, email.trim());
    },
    activate: async (code) => {
      const { customToken, driverName } = await api.activate(code);
      // A fresh activation always starts over: new session, new PIN.
      if (auth.currentUser) await signOut(auth);
      await clearPin();
      setNotice(undefined);
      queryClient.clear();
      await signInWithCustomToken(auth, customToken);
      return { driverName };
    },
    createPin: async (pin) => {
      if (state.status !== 'driver') throw new Error('Activate the app first.');
      await savePin(state.user.uid, pin);
      setState({ ...state, pin: 'unlocked' });
    },
    unlock: async (pin) => {
      if (state.status !== 'driver') return { ok: false, attemptsLeft: 0 };
      const result = await checkPin(state.user.uid, pin);
      if (result.ok) setState({ ...state, pin: 'unlocked' });
      else if (result.attemptsLeft === 0) {
        await signOutPhone('Too many wrong PINs. Ask your fleet for a new activation code.');
      }
      return result;
    },
    lock: () => {
      setState((current) =>
        current.status === 'driver' && current.pin === 'unlocked' ? { ...current, pin: 'locked' } : current,
      );
    },
    signOutPhone,
    refreshAccess: async () => {
      const user = auth.currentUser;
      if (!user) return false;
      try {
        await user.getIdToken(true);
        return true;
      } catch (error) {
        return !isDeadSession(error);
      }
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>.');
  return value;
}

/** The session if there is one; `null` outside `<SessionProvider>` (e.g. a screen rendered on its own in a test). */
export function useOptionalSession(): SessionValue | null {
  return useContext(SessionContext);
}
