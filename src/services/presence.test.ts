import { startPresence } from './presence';

const mockDb = {};
jest.mock('@/services/firebase', () => ({ realtimeDb: () => mockDb }));

const mockSet = jest.fn(async () => undefined);
const mockDisconnectSet = jest.fn(async () => undefined);
const mockCancel = jest.fn(async () => undefined);
type Snap = { val: () => unknown; exists: () => boolean };
const mockListeners: Record<string, (snap: Snap) => void> = {};
const mockUnsubscribe = jest.fn();

jest.mock('firebase/database', () => ({
  ref: (_db: unknown, path: string) => ({ path }),
  serverTimestamp: () => 'SERVER_TIME',
  onValue: (r: { path: string }, cb: (snap: Snap) => void) => {
    mockListeners[r.path] = cb;
    return mockUnsubscribe;
  },
  onDisconnect: () => ({ set: mockDisconnectSet, cancel: mockCancel }),
  set: (...args: unknown[]) => mockSet(...(args as [])),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const snap = (v: unknown): Snap => ({ val: () => v, exists: () => v != null });
const connect = (v: boolean) => mockListeners['.info/connected']?.(snap(v));
const liveRecord = (authUid: string | null) => mockListeners['driverLocations/d1/meta/authUid']?.(snap(authUid));

describe('startPresence', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers the server-side offline write before marking the driver online', async () => {
    startPresence('d1');
    liveRecord('driver-d1');
    connect(true);
    await flush();
    expect(mockDisconnectSet).toHaveBeenCalledWith({ online: false, at: 'SERVER_TIME' });
    expect(mockSet).toHaveBeenCalledWith({ path: 'driverLocations/d1/presence' }, { online: true, at: 'SERVER_TIME' });
    expect(mockDisconnectSet.mock.invocationCallOrder[0]).toBeLessThan(mockSet.mock.invocationCallOrder[0]);
  });

  it('does nothing while disconnected (the server already marked it offline)', async () => {
    startPresence('d1');
    liveRecord('driver-d1');
    connect(false);
    await flush();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('waits for the live record of a new assignment before going online', async () => {
    startPresence('d1');
    connect(true);
    liveRecord(null);
    await flush();
    expect(mockSet).not.toHaveBeenCalled();
    liveRecord('driver-d1');
    await flush();
    expect(mockSet).toHaveBeenCalledWith({ path: 'driverLocations/d1/presence' }, { online: true, at: 'SERVER_TIME' });
  });

  it('marks the driver offline at once when stopped (locked, shift ended)', async () => {
    const stop = startPresence('d1');
    stop();
    await flush();
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({ path: 'driverLocations/d1/presence' }, { online: false, at: 'SERVER_TIME' });
    expect(mockCancel).toHaveBeenCalled();
  });
});
