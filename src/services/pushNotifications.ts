import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import { colors } from '@/constants/theme';

/**
 * Push notifications for "Notify me when one is coming" (jeep-coming-alert). `expo-notifications` is a native
 * module: an APK built before it was added has no such module, so everything here quietly does nothing there and
 * the in-app banner carries the alert.
 */

type NotificationsModule = typeof import('expo-notifications');

/** The Android channel the backend's alerts use. */
export const JEEP_COMING_CHANNEL = 'jeep-coming';

let cached: NotificationsModule | null | undefined;

/** `expo-notifications`, or null when this build does not have it. */
export function notifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  try {
    cached = requireOptionalNativeModule('ExpoPushTokenManager')
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require('expo-notifications') as NotificationsModule)
      : null;
  } catch {
    cached = null;
  }
  return cached;
}

/**
 * Asks for notification permission (once; the OS remembers) and returns this phone's Expo push token, or undefined
 * when the build has no push, the commuter said no, or the token could not be fetched.
 */
export async function getPushToken(): Promise<string | undefined> {
  const N = notifications();
  if (!N || Platform.OS === 'web') return undefined;
  try {
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(JEEP_COMING_CHANNEL, {
        name: 'Jeepney coming',
        importance: N.AndroidImportance.HIGH,
        lightColor: colors.brandAction,
      });
    }
    let perm = await N.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await N.requestPermissionsAsync();
    if (!perm.granted) return undefined;
    const projectId =
      (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ??
      Constants.easConfig?.projectId;
    const token = await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return token.data;
  } catch {
    return undefined;
  }
}
