import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Whether this build can draw a map.
 * - iOS uses Apple Maps: always.
 * - Android uses Google Maps, which needs a Maps SDK key in the build (GOOGLE_MAPS_ANDROID_API_KEY, see app.config.ts).
 *   Without one the native map crashes the app ("API key not found"), so screens show a notice instead.
 *   Expo Go ships its own key.
 */
export function mapsAvailable(): boolean {
  if (Platform.OS !== 'android') return true;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return true;
  return Constants.expoConfig?.extra?.androidMapsKey === true;
}
