import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * This phone's id for the welcome credit (starter-credit-per-device), which is given once per device:
 * - Android: the Android id (per device and app signing key; it survives reinstalling the app);
 * - iOS: a random id kept in the Keychain, which also survives deleting and reinstalling the app.
 * Web has none (the credit is for app installs). The backend stores only a salted hash of it.
 */
export type DeviceIdentity = { platform: 'ios' | 'android'; deviceId: string };

const IOS_KEY = 'para.deviceId';

export async function getDeviceIdentity(): Promise<DeviceIdentity | undefined> {
  try {
    if (Platform.OS === 'android') {
      const id = Application.getAndroidId();
      return id ? { platform: 'android', deviceId: id } : undefined;
    }
    if (Platform.OS === 'ios') {
      let id = await SecureStore.getItemAsync(IOS_KEY);
      if (!id) {
        id = Crypto.randomUUID();
        // Kept after the first unlock, on this phone only (not restored to another phone from a backup).
        await SecureStore.setItemAsync(IOS_KEY, id, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
      }
      return { platform: 'ios', deviceId: id };
    }
  } catch {
    // No id (e.g. Keychain unavailable): no welcome credit, nothing else changes.
  }
  return undefined;
}
