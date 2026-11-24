// Safe-area insets are not measured in Jest; use the library's official mock.
// https://github.com/AppAndFlow/react-native-safe-area-context#testing
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// Reanimated is native (layout animations on the Driver Hub). Tests check what is shown, not the motion: a plain
// View, and animation presets that chain to themselves. expo-router's testing library mocks Reanimated with
// 'react-native-reanimated/mock', which cannot load here, so that path gets the same stand-in.
const mockReanimated = () => {
  const { View } = jest.requireActual('react-native');
  const preset: Record<string, unknown> = {};
  for (const m of ['duration', 'delay', 'springify', 'damping', 'easing']) preset[m] = () => preset;
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    View,
    FadeInDown: preset,
    FadeOutUp: preset,
    LinearTransition: preset,
  };
};
jest.mock('react-native-reanimated', () => mockReanimated());
jest.mock('react-native-reanimated/mock', () => mockReanimated());

// react-native-maps is a native module: stub it everywhere so map overlays render as plain Views.
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MapView = React.forwardRef(
    (props: { children?: React.ReactNode; testID?: string; accessibilityLabel?: string }, _ref: unknown) =>
      React.createElement(View, { testID: props.testID, accessibilityLabel: props.accessibilityLabel }, props.children),
  );
  MapView.displayName = 'MapView';
  const Passthrough = ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children);
  class AnimatedRegion {
    coordinate: { latitude: number; longitude: number };
    constructor(coordinate: { latitude: number; longitude: number }) {
      this.coordinate = coordinate;
    }
    timing() {
      return { start: () => undefined };
    }
  }
  return {
    __esModule: true,
    default: MapView,
    Marker: Passthrough,
    MarkerAnimated: Passthrough,
    AnimatedRegion,
    Callout: Passthrough,
    Polyline: () => null,
  };
});

// AsyncStorage is a native module: use the library's official in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Firebase is not started in tests.
jest.mock('@/services/firebase', () => ({
  auth: {},
  getIdToken: async () => null,
  isDeadSession: () => false,
}));

// One shared session for every test. It starts each test as an activated, unlocked driver; tests switch
// `status` (e.g. to 'commuter' or 'signedOut') through `jest.requireMock('@/hooks/useSession').mockSession`.
jest.mock('@/hooks/useSession', () => {
  const initial = () => ({
    status: 'driver',
    user: { uid: 'driver-test', displayName: 'Ernesto Santos', email: null },
    driverId: 'test',
    pin: 'unlocked',
    notice: undefined,
  });
  const mockSession = {
    ...initial(),
    signIn: jest.fn(async () => undefined),
    signUp: jest.fn(async () => undefined),
    signInWithGoogle: jest.fn(async () => true),
    resetPassword: jest.fn(async () => undefined),
    activate: jest.fn(async () => ({ driverName: 'Ernesto Santos' })),
    createPin: jest.fn(async () => undefined),
    unlock: jest.fn(async () => ({ ok: true, attemptsLeft: 5 })),
    lock: jest.fn(),
    signOutPhone: jest.fn(async () => undefined),
    refreshAccess: jest.fn(async () => true),
  };
  return {
    mockSession,
    resetMockSession: () => Object.assign(mockSession, initial()),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
    useSession: () => mockSession,
    useOptionalSession: () => mockSession,
    authErrorMessage: (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.'),
  };
});

// The commuter live map's data (routes, road paths, live jeeps) comes from the backend: none in tests.
jest.mock('@/screens/commuters/LiveTracking/useLiveCorridor', () => ({
  ...jest.requireActual('@/screens/commuters/LiveTracking/useLiveCorridor'),
  useLiveCorridor: (route: unknown) => ({
    route,
    stops: { outbound: [], inbound: [] },
    namedStops: { outbound: [], inbound: [] },
    jeeps: [],
    loading: false,
  }),
}));

// The routes on the commuter's way (routesForCommute + live jeeps), for the Commute hub: Route 17B with one jeep
// going north (outbound) and Route 04L with none. Stops run along a straight street (0.01° ≈ 1.1 km).
// Tests change it through `jest.requireMock('@/screens/commuters/LiveTracking/useRoutesOnMyWay').mockRoutesOnMyWay`.
jest.mock('@/screens/commuters/LiveTracking/useRoutesOnMyWay', () => {
  const stops = (lng: number, names: string[]) =>
    names.map((name, i) => ({ id: `${name}-${i}`, name, kind: 'stop', lat: 10.3 + i * 0.01, lng }));
  const route = (id: string, code: string, name: string, lng: number, ends: [string, string], extra: object) => {
    const outbound = stops(lng, [ends[0], 'Middle Stop', `${ends[1]} Stop`, ends[1]]);
    return {
      id,
      code,
      name,
      status: 'active',
      ...extra,
      directions: {
        outbound: { label: `Going to ${ends[1]}`, via: `${ends[0]} → ${ends[1]}`, waypoints: outbound },
        inbound: { label: `Going back to ${ends[0]}`, via: '', waypoints: [...outbound].reverse() },
      },
    };
  };
  const r17b = route('r17b', '17B', 'Apas ⇄ Sto. Niño', 123.9, ['Apas', 'Sto. Niño'], {
    baseFare: 15,
    roundtripKm: 14.8,
  });
  const r04l = route('r04l', '04L', 'IT Park ⇄ SM Cebu City', 123.95, ['IT Park', 'SM Cebu City'], {
    baseFare: 13,
    roundtripKm: 0,
  });
  const mockRoutesOnMyWay = {
    preferred: r17b,
    routes: [r17b, r04l],
    jeepsByRoute: {
      r17b: [
        {
          driverId: 'd1',
          unitCode: 'PARA-00001',
          plate: 'ABC-1234',
          coordinate: { latitude: 10.305, longitude: 123.9 },
          heading: 0,
          speed: 8,
          at: 0,
        },
      ],
    },
    pathsByRoute: {},
    loading: false,
    error: null as Error | null,
  };
  return { mockRoutesOnMyWay, useRoutesOnMyWay: () => mockRoutesOnMyWay };
});

// The Live Map's route list (routesForCommute + live jeeps): the sample rows, with 17B as the preferred route.
// Tests change it through `jest.requireMock('@/screens/commuters/LiveTracking/useCommuteOptions').mockCommute`.
jest.mock('@/screens/commuters/LiveTracking/useCommuteOptions', () => {
  const { routeOptions } = jest.requireActual('@/services/mock/commuterData');
  const route = (code: string) => ({
    id: `route-${code}`,
    code,
    name: `Route ${code}`,
    status: 'active',
    directions: {
      outbound: { label: 'Outbound', via: '', waypoints: [] },
      inbound: { label: 'Return trip', via: '', waypoints: [] },
    },
  });
  const options = routeOptions.map((o: { code: string }) => ({
    ...o,
    routeId: `route-${o.code}`,
    route: route(o.code),
  }));
  const mockCommute = {
    options,
    preferred: route('17B'),
    jeepsByRoute: {},
    pathsByRoute: {},
    loading: false,
    notice: undefined as string | undefined,
  };
  return { mockCommute, useCommuteOptions: () => mockCommute };
});

// The commuter's own location: none in tests (permission still being asked).
// Tests may set a location through `jest.requireMock('@/hooks/useCommuterLocation').mockLocation.current`.
jest.mock('@/hooks/useCommuterLocation', () => {
  const mockLocation: { current: { status: string; coordinate?: unknown } } = { current: { status: 'pending' } };
  return { mockLocation, useCommuterLocation: () => ({ ...mockLocation.current, retry: jest.fn() }) };
});

// The driver's live passenger load (Realtime Database): kept in memory in tests.
// Tests read and change it through `jest.requireMock('@/hooks/usePassengerLoad').mockLoad`.
jest.mock('@/hooks/usePassengerLoad', () => {
  const React = jest.requireActual('react');
  const mockLoad = { saved: [] as number[] };
  return {
    mockLoad,
    usePassengerLoad: () => {
      const [occupied, setOccupied] = React.useState(0);
      return {
        occupied,
        change: (n: number) => {
          mockLoad.saved.push(n);
          setOccupied(n);
        },
        saveError: undefined,
      };
    },
  };
});

// The ₱1 live pass comes from the backend (walletMe / viewsPurchase). In tests: an in-memory pass covering every
// jeepney, the sample ₱45 until something is bought, and `buyLivePass()` / `resetLivePasses()` to set it up.
jest.mock('@/hooks/useLivePass', () => {
  const React = jest.requireActual('react');
  const actual = jest.requireActual('@/hooks/useLivePass');
  let state: { until: number; balance?: number } = { until: 0 };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const buyLivePass = () => {
    state = { until: Date.now() + 15 * 60_000, balance: (state.balance ?? 45) - 1 };
    emit();
  };
  const resetLivePasses = () => {
    state = { until: 0 };
    emit();
  };
  /** ad-supported-live-view: the wallet balance in pesos (under 1 → Watch Ads). */
  const setLiveBalance = (balance: number) => {
    state = { ...state, balance };
    emit();
  };
  return {
    ...actual,
    buyLivePass,
    resetLivePasses,
    setLiveBalance,
    useLivePass: () => {
      const s = React.useSyncExternalStore(
        (l: () => void) => (listeners.add(l), () => listeners.delete(l)),
        () => state,
      );
      const active = s.until > Date.now();
      return {
        has: () => active,
        minutesLeft: () => (active ? actual.minutesLeftUntil(s.until) : undefined),
        driverIds: active ? ['d1'] : [],
        balance: s.balance,
        canPay: s.balance === undefined || s.balance >= 1,
        adsEnabled: true,
        adMinutes: 3,
        paraAds: false,
        passKind: active ? 'paid' : undefined,
        refresh: async () => active,
        buy: async () => {
          buyLivePass();
          return { charged: true, pass: { until: state.until, driverIds: ['d1'], viewId: 'v1' } };
        },
        buying: false,
      };
    },
  };
});

// The driver's live duty (assignment listener + GPS). Tests change it through
// `jest.requireMock('@/hooks/useDuty').mockDuty`.
jest.mock('@/hooks/useDuty', () => {
  const initial = () => ({
    assignmentId: 'a1',
    dutyStatus: 'in_service',
    ready: true,
    tracking: { state: 'live', lastSentAt: undefined },
    error: undefined,
    busy: false,
  });
  const mockDuty = {
    ...initial(),
    setBreak: jest.fn(async () => undefined),
    endShift: jest.fn(async () => undefined),
  };
  return {
    mockDuty,
    resetMockDuty: () => Object.assign(mockDuty, initial()),
    DutyProvider: ({ children }: { children: React.ReactNode }) => children,
    useDuty: () => mockDuty,
  };
});

// The driver's earnings today (Firestore listener). Tests change it through
// `jest.requireMock('@/hooks/useDriverEarnings').mockEarnings`.
jest.mock('@/hooks/useDriverEarnings', () => {
  const actual = jest.requireActual('@/hooks/useDriverEarnings');
  const initial = () => ({ views: 0, driver: 0, unit: 0, driverPct: undefined, units: [], loading: false });
  const mockEarnings = initial();
  return {
    ...actual,
    mockEarnings,
    resetMockEarnings: () => Object.assign(mockEarnings, initial()),
    useDriverEarnings: () => mockEarnings,
  };
});

// Push notifications (native): none in tests.
jest.mock('@/services/pushNotifications', () => ({
  JEEP_COMING_CHANNEL: 'jeep-coming',
  notifications: () => null,
  getPushToken: async () => undefined,
}));

// The commuter's free "Notify me" watch (Firestore listener). Tests change it through
// `jest.requireMock('@/hooks/useJeepWatch').mockWatch`.
jest.mock('@/hooks/useJeepWatch', () => {
  const initial = () => ({ watch: null, minutesLeft: undefined, busy: false });
  const mockWatch = {
    ...initial(),
    start: jest.fn(async () => ({ push: true })),
    cancel: jest.fn(async () => undefined),
  };
  return {
    mockWatch,
    resetMockWatch: () => {
      Object.assign(mockWatch, initial());
      mockWatch.start.mockClear();
      mockWatch.cancel.mockClear();
    },
    useJeepWatch: () => mockWatch,
  };
});

beforeEach(() => {
  jest.requireMock('@/hooks/useJeepWatch').resetMockWatch();
  jest.requireMock('@/hooks/useDriverEarnings').resetMockEarnings();
  jest.requireMock('@/hooks/useLivePass').resetLivePasses();
  jest.requireMock('@/hooks/useCommuterLocation').mockLocation.current = { status: 'pending' };
  jest.requireMock('@/hooks/useSession').resetMockSession();
  jest.requireMock('@/hooks/useDuty').resetMockDuty();
  jest.requireMock('@packages/tanstack/query/driver').resetMockPayouts();
});

// The driver's assignment, as the backend returns it.
jest.mock('@packages/tanstack/query/driver', () => {
  const data = {
    driver: {
      id: 'test',
      driverNo: 'DRV-0042',
      name: 'Ernesto Santos',
      status: 'active',
      licenseExpiry: '2028-12',
      licenseRenewalSoon: false,
    },
    fleet: { name: 'Fleet Officer' },
    assignment: {
      unitCode: 'U-08',
      plate: 'NDF-4821',
      type: 'modern',
      make: 'Isuzu',
      seats: 22,
      vehicleStatus: 'active',
      routeId: 'r1',
      routeCode: '17B',
      routeName: 'Apas ⇄ Carbon',
      start: '2026-11-01',
      id: 'a1',
      dutyStatus: 'in_service',
    },
  };
  // Fleet-driver-payouts: tests set `mockPayouts.list` (reset before each test).
  const mockPayouts: {
    list: unknown[];
    confirm: jest.Mock;
    receiptUrl: jest.Mock;
    /** driver-unit-earnings: the period summary and each day's pages, by day. */
    summary: unknown;
    days: Record<string, unknown[]>;
    summaryRange: jest.Mock;
    /** driver-pay-balance: what the driver is still owed (undefined = loading). */
    balance: unknown;
  } = {
    list: [],
    confirm: jest.fn(),
    receiptUrl: jest.fn(),
    summary: undefined,
    days: {},
    summaryRange: jest.fn(),
    balance: undefined,
  };
  return {
    mockPayouts,
    resetMockPayouts: () => {
      mockPayouts.list = [];
      mockPayouts.confirm = jest.fn();
      mockPayouts.receiptUrl = jest.fn();
      mockPayouts.summary = undefined;
      mockPayouts.days = {};
      mockPayouts.summaryRange = jest.fn();
      mockPayouts.balance = undefined;
    },
    useEarningsSummary: (range: unknown) => {
      mockPayouts.summaryRange(range);
      return { data: mockPayouts.summary, isLoading: false, error: null, refetch: jest.fn() };
    },
    useEarningsDay: (day?: string) => {
      const pages = day ? mockPayouts.days[day] : undefined;
      return {
        data: pages ? { pages } : undefined,
        isLoading: false,
        error: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
      };
    },
    useDriverPayBalance: () => ({ data: mockPayouts.balance, isLoading: false, error: null, refetch: jest.fn() }),
    useDriverPayouts: () => ({ data: mockPayouts.list, isLoading: false, error: null, refetch: jest.fn() }),
    useConfirmPayout: () => ({ mutate: (...args: unknown[]) => mockPayouts.confirm(...args), isPending: false }),
    useReceiptUrl: () => ({ mutate: (...args: unknown[]) => mockPayouts.receiptUrl(...args), isPending: false }),
    useDriverMe: () => ({ data, isLoading: false, error: null, refetch: jest.fn() }),
    useDriverApi: () => ({
      activate: jest.fn(),
      me: jest.fn(async () => data),
      setDuty: jest.fn(async (status: string) => ({ assignmentId: 'a1', dutyStatus: status })),
      endShift: jest.fn(async () => ({ assignmentId: 'a1', dutyStatus: 'off_duty' })),
    }),
    driverKeys: { all: ['driver'], me: () => ['driver', 'me'], payouts: () => ['driver', 'payouts'] },
  };
});

// ad-supported-live-view: rewarded ads and the ad calls. Tests change `mockAds`.
jest.mock('@/services/rewardedAds', () => {
  const mockAds = { supported: true, outcome: 'earned' as 'earned' | 'closed' | 'failed' };
  return {
    mockAds,
    adsSupported: () => mockAds.supported,
    usesTestAd: () => false,
    confirmsRewardLocally: () => false,
    adsModule: () => undefined,
    showRewardedAd: jest.fn(async () => mockAds.outcome),
  };
});
jest.mock('@packages/tanstack/query/views', () => {
  const actual = jest.requireActual('@packages/tanstack/query/views');
  const mockViewsApi = {
    adViewStart: jest.fn(async () => ({ started: true, adViewId: 'ad1', passMinutes: 3 })),
    adViewDevReward: jest.fn(async () => ({ result: 'granted' })),
    paraAdViewed: jest.fn(async () => ({ result: 'granted', charged: true })),
  };
  return { ...actual, mockViewsApi, useViewsApi: () => mockViewsApi };
});

// AsyncStorage is native: its official Jest mock (preferred-route saves the picked route on the phone).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Gesture Handler and @gorhom/bottom-sheet are native: use their official Jest setup and mock (live-map-bottom-sheet).
// https://gorhom.dev/react-native-bottom-sheet/troubleshooting#jest
require('react-native-gesture-handler/jestSetup');
// The mock has no __esModule flag, so a default import would get the whole object: add it.
jest.mock('@gorhom/bottom-sheet', () => ({ __esModule: true, ...require('@gorhom/bottom-sheet/mock') }));
