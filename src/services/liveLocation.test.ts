import { toLivePosition } from './liveLocation';

const coords = (over: Partial<Parameters<typeof toLivePosition>[0]> = {}) => ({
  latitude: 10.3157,
  longitude: 123.8854,
  altitude: null,
  accuracy: 8,
  altitudeAccuracy: null,
  heading: 90,
  speed: 6.5,
  ...over,
});

describe('toLivePosition', () => {
  it('keeps the readings the database rules accept', () => {
    expect(toLivePosition(coords())).toEqual({ lat: 10.3157, lng: 123.8854, heading: 90, speed: 6.5, accuracy: 8 });
  });

  it('leaves out missing or out-of-range readings', () => {
    expect(toLivePosition(coords({ heading: -1, speed: null, accuracy: Number.NaN }))).toEqual({
      lat: 10.3157,
      lng: 123.8854,
    });
    expect(toLivePosition(coords({ speed: 250 }))).not.toHaveProperty('speed');
  });
});

// driver-background-gps: "Always" location keeps GPS going with the phone locked; asked once, after an explanation.
jest.mock('expo-task-manager', () => ({ isTaskDefined: jest.fn(() => false), defineTask: jest.fn() }));
jest.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  ActivityType: { AutomotiveNavigation: 2 },
  getBackgroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  hasServicesEnabledAsync: jest.fn(async () => true),
  startLocationUpdatesAsync: jest.fn(async () => undefined),
  stopLocationUpdatesAsync: jest.fn(async () => undefined),
  hasStartedLocationUpdatesAsync: jest.fn(async () => true),
  watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
  getLastKnownPositionAsync: jest.fn(async () => null),
}));
jest.mock('firebase/database', () => ({ ref: jest.fn(() => ({})), set: jest.fn(async () => undefined), serverTimestamp: jest.fn() }));
jest.mock('@/services/firebase', () => ({ realtimeDb: jest.fn(() => ({})) }));

describe('background GPS', () => {
  const Location = jest.requireMock('expo-location');
  const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage');
  const { Alert } = jest.requireActual('react-native');
  const answer = (button: 'Allow' | 'Not now') =>
    jest.spyOn(Alert, 'alert').mockImplementation((...args: unknown[]) => {
      const buttons = args[2] as { text: string; onPress?: () => void }[];
      buttons.find((b) => b.text === button)?.onPress?.();
    });
  const { backgroundAllowed, startLiveTracking, BACKGROUND_ASKED_KEY, DRIVER_LOCATION_TASK } =
    jest.requireActual<typeof import('./liveLocation')>('./liveLocation');
  const flush = () => new Promise((r) => setTimeout(r, 0));

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Location.getBackgroundPermissionsAsync.mockResolvedValue({ status: 'undetermined', canAskAgain: true });
    Location.requestBackgroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  });
  afterEach(() => jest.restoreAllMocks());

  it('uses "Always" when already allowed, without asking', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    Location.getBackgroundPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });
    expect(await backgroundAllowed()).toBe(true);
    expect(alert).not.toHaveBeenCalled();
  });

  it('explains first, then asks the system on Allow', async () => {
    const alert = answer('Allow');
    expect(await backgroundAllowed()).toBe(true);
    expect(alert).toHaveBeenCalledWith('Keep sharing when the phone is locked?', expect.any(String), expect.any(Array), {
      cancelable: false,
    });
    expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalled();
  });

  it('asks only once: "Not now" is remembered', async () => {
    answer('Not now');
    expect(await backgroundAllowed()).toBe(false);
    expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem(BACKGROUND_ASKED_KEY)).toBe('1');
    const alert = answer('Allow');
    alert.mockClear();
    expect(await backgroundAllowed()).toBe(false);
    expect(alert).not.toHaveBeenCalled();
  });

  it('runs the background task with the Android notification, and stops it with tracking', async () => {
    Location.getBackgroundPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });
    const states: unknown[] = [];
    const stop = startLiveTracking('drv1', (s) => states.push(s));
    await flush();
    await flush();
    expect(Location.startLocationUpdatesAsync).toHaveBeenCalledWith(
      DRIVER_LOCATION_TASK,
      expect.objectContaining({
        pausesUpdatesAutomatically: false,
        foregroundService: expect.objectContaining({ killServiceOnDestroy: true }),
      }),
    );
    expect(Location.watchPositionAsync).not.toHaveBeenCalled();
    expect(states).toContainEqual({ state: 'live', background: true });
    stop();
    await flush();
    await flush();
    expect(Location.stopLocationUpdatesAsync).toHaveBeenCalledWith(DRIVER_LOCATION_TASK);
  });

  it('falls back to the in-app watch without "Always"', async () => {
    Location.getBackgroundPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false });
    const states: unknown[] = [];
    const stop = startLiveTracking('drv1', (s) => states.push(s));
    await flush();
    await flush();
    expect(Location.watchPositionAsync).toHaveBeenCalled();
    expect(Location.startLocationUpdatesAsync).not.toHaveBeenCalled();
    expect(states).toContainEqual({ state: 'live', background: false });
    stop();
  });
});
