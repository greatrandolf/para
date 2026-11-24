import { act, renderHook } from '@testing-library/react-native';

import { getDeviceIdentity } from '@/services/deviceId';

import { useStarterCredit } from './useStarterCredit';

jest.mock('@/services/deviceId', () => ({ getDeviceIdentity: jest.fn() }));
jest.mock('@tanstack/react-query', () => {
  const invalidateQueries = jest.fn(async () => undefined);
  return { ...jest.requireActual('@tanstack/react-query'), useQueryClient: () => ({ invalidateQueries }) };
});
const mockWallet: { data?: { starterEligible?: boolean } } = {};
const mockClaim = jest.fn();
jest.mock('@packages/tanstack/query/views', () => {
  const api = { claimStarter: (...args: unknown[]) => mockClaim(...args) };
  return {
    viewKeys: { wallet: () => ['views', 'wallet'] },
    useWallet: () => mockWallet,
    useViewsApi: () => api,
  };
});

const session = () => jest.requireMock('@/hooks/useSession').mockSession;
const flush = () => act(async () => undefined);

describe('useStarterCredit (starter-credit-per-device)', () => {
  beforeEach(() => {
    Object.assign(session(), { status: 'commuter', user: { uid: 'c1' } });
    mockClaim.mockReset().mockResolvedValue({ credited: true, amountCentavos: 300, balanceCentavos: 300 });
    jest.mocked(getDeviceIdentity).mockResolvedValue({ platform: 'android', deviceId: 'a1b2c3d4e5f60718' });
  });
  afterEach(() => jest.requireMock('@/hooks/useSession').resetMockSession());

  it('claims the welcome credit once with this phone when the wallet can', async () => {
    mockWallet.data = { starterEligible: true };
    const { rerender } = await renderHook(() => useStarterCredit());
    await flush();
    rerender({});
    await flush();
    expect(mockClaim).toHaveBeenCalledTimes(1);
    expect(mockClaim).toHaveBeenCalledWith({ platform: 'android', deviceId: 'a1b2c3d4e5f60718' });
  });

  it('does nothing for wallets that already claimed (or older wallets)', async () => {
    mockWallet.data = { starterEligible: false };
    await renderHook(() => useStarterCredit());
    await flush();
    expect(mockClaim).not.toHaveBeenCalled();
  });

  it('does nothing without a device id (web)', async () => {
    mockWallet.data = { starterEligible: true };
    jest.mocked(getDeviceIdentity).mockResolvedValue(undefined);
    await renderHook(() => useStarterCredit());
    await flush();
    expect(mockClaim).not.toHaveBeenCalled();
  });
});
