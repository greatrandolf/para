import type { Persistence } from 'firebase/auth';

/**
 * Firebase's React Native build (which Metro loads on iOS and Android) exports getReactNativePersistence, but the
 * package's `types` entry only describes the browser build. This declares the one missing function.
 */
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
