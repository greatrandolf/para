import { Platform } from 'react-native';

import { mapsAvailable } from './maps';

const mockConstants: { executionEnvironment: string; expoConfig: { extra: Record<string, unknown> } } = {
  executionEnvironment: 'standalone',
  expoConfig: { extra: {} },
};
jest.mock('expo-constants', () => ({
  __esModule: true,
  // A getter: the factory runs before `mockConstants` is initialised.
  get default() {
    return mockConstants;
  },
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
}));

describe('mapsAvailable', () => {
  const os = Platform.OS;
  const set = (platform: string, env: string, extra: Record<string, unknown>) => {
    Object.defineProperty(Platform, 'OS', { value: platform, configurable: true });
    mockConstants.executionEnvironment = env;
    mockConstants.expoConfig = { extra };
  };
  afterEach(() => Object.defineProperty(Platform, 'OS', { value: os, configurable: true }));

  it('is always on for iOS (Apple Maps)', () => {
    set('ios', 'standalone', {});
    expect(mapsAvailable()).toBe(true);
  });

  it('needs a Google Maps key in an Android build', () => {
    set('android', 'standalone', {});
    expect(mapsAvailable()).toBe(false);
    set('android', 'standalone', { androidMapsKey: true });
    expect(mapsAvailable()).toBe(true);
  });

  it('works in Expo Go, which has its own key', () => {
    set('android', 'storeClient', {});
    expect(mapsAvailable()).toBe(true);
  });
});
