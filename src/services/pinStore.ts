import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * The phone's 6-digit app PIN. It never leaves the device: only a salted SHA-256 hash is kept, in the Keychain /
 * Keystore (SecureStore). Web (development only) falls back to localStorage.
 */

const KEY = 'para.driverPin';
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LENGTH = 6;

type Stored = { uid: string; salt: string; hash: string; failures: number };

const storage = {
  get: async (key: string) =>
    Platform.OS === 'web' ? (globalThis.localStorage?.getItem(key) ?? null) : SecureStore.getItemAsync(key),
  set: async (key: string, value: string) =>
    Platform.OS === 'web' ? globalThis.localStorage?.setItem(key, value) : SecureStore.setItemAsync(key, value),
  remove: async (key: string) =>
    Platform.OS === 'web' ? globalThis.localStorage?.removeItem(key) : SecureStore.deleteItemAsync(key),
};

const digest = (salt: string, pin: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);

async function read(): Promise<Stored | null> {
  const raw = await storage.get(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Stored;
  } catch {
    return null;
  }
}

export const isValidPin = (pin: string) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);

/** Whether this phone has a PIN for the signed-in driver (a PIN of a previous driver doesn't count). */
export async function hasPin(uid: string): Promise<boolean> {
  return (await read())?.uid === uid;
}

export async function savePin(uid: string, pin: string): Promise<void> {
  if (!isValidPin(pin)) throw new Error(`The PIN must be ${PIN_LENGTH} digits.`);
  const salt = Crypto.randomUUID();
  await storage.set(KEY, JSON.stringify({ uid, salt, hash: await digest(salt, pin), failures: 0 } satisfies Stored));
}

/** Checks a PIN. After MAX_PIN_ATTEMPTS wrong tries in a row it reports `locked`, and the caller signs out. */
export async function checkPin(uid: string, pin: string): Promise<{ ok: boolean; attemptsLeft: number }> {
  const stored = await read();
  if (!stored || stored.uid !== uid) return { ok: false, attemptsLeft: 0 };
  if ((await digest(stored.salt, pin)) === stored.hash) {
    if (stored.failures) await storage.set(KEY, JSON.stringify({ ...stored, failures: 0 }));
    return { ok: true, attemptsLeft: MAX_PIN_ATTEMPTS };
  }
  const failures = stored.failures + 1;
  await storage.set(KEY, JSON.stringify({ ...stored, failures }));
  return { ok: false, attemptsLeft: Math.max(0, MAX_PIN_ATTEMPTS - failures) };
}

export async function clearPin(): Promise<void> {
  await storage.remove(KEY);
}
