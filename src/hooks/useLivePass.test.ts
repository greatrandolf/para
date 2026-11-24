import { minutesLeftUntil, passCoversRoute } from './useLivePass';

describe('minutesLeftUntil', () => {
  it('counts whole minutes left, rounded up, until the pass ends', () => {
    expect(minutesLeftUntil(15 * 60_000, 0)).toBe(15);
    expect(minutesLeftUntil(15 * 60_000, 60_000)).toBe(14);
    expect(minutesLeftUntil(15 * 60_000, 15 * 60_000 - 1)).toBe(1);
    expect(minutesLeftUntil(15 * 60_000, 15 * 60_000)).toBeUndefined();
    expect(minutesLeftUntil(undefined, 0)).toBeUndefined();
  });
});

describe('passCoversRoute', () => {
  const paid = { until: 100, driverIds: ['d1'], viewId: 'v1', kind: 'paid' as const };
  const ad = { ...paid, kind: 'ad' as const, routeIds: ['r17b'], routeCodes: ['17B'] };

  it('a ₱1 pass unlocks every route on the way', () => {
    expect(passCoversRoute(paid, '17B', 0)).toBe(true);
    expect(passCoversRoute(paid, '14D', 0)).toBe(true);
  });

  it('an ad pass unlocks only the route it was watched for', () => {
    expect(passCoversRoute(ad, '17B', 0)).toBe(true);
    expect(passCoversRoute(ad, '14D', 0)).toBe(false);
    expect(passCoversRoute(ad, undefined, 0)).toBe(false);
  });

  it('an ended or missing pass unlocks nothing', () => {
    expect(passCoversRoute(paid, '17B', 100)).toBe(false);
    expect(passCoversRoute(null, '17B', 0)).toBe(false);
  });
});
