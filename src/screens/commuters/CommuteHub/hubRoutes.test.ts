import type { Route } from '@packages/tanstack/query/routes';

import { buildPath } from '@/screens/commuters/LiveTracking/livePath';
import type { LiveJeep } from '@/screens/commuters/LiveTracking/useLiveCorridor';

import { hubFilterOptions, toTransitRoute } from './hubRoutes';

const LNG = 123.9;
const stops = (names: string[]) => names.map((name, i) => ({ id: name, name, kind: 'stop', lat: 10.3 + i * 0.01, lng: LNG }));
const outbound = stops(['Apas', 'Lahug', 'Colon', 'Sto. Niño']);
const route = (extra: Partial<Route> = {}): Route => ({
  id: 'r1',
  code: '17B',
  name: 'Apas ⇄ Sto. Niño',
  status: 'active',
  baseFare: 15,
  roundtripKm: 14.8,
  directions: {
    outbound: { label: 'Going to Sto. Niño', via: 'Apas → Sto. Niño via Lahug', waypoints: outbound },
    inbound: { label: 'Going back to Apas', via: '', waypoints: [...outbound].reverse() },
  },
  ...extra,
});
const jeep = (lat: number, heading?: number, speed = 8, lng = LNG): LiveJeep => ({
  driverId: `d${lat}${heading}`,
  unitCode: 'U',
  plate: 'P',
  coordinate: { latitude: lat, longitude: lng },
  heading,
  speed,
  at: 0,
});

describe('toTransitRoute', () => {
  it('counts jeeps on the road per direction by their heading', () => {
    const card = toTransitRoute(route(), [jeep(10.305, 0), jeep(10.315, 0), jeep(10.325, 180)]);
    expect(card.directionsOnRoad).toEqual([
      { label: 'Going to Sto. Niño', count: 2 },
      { label: 'Going back to Apas', count: 1 },
    ]);
    expect(card).toMatchObject({ vehiclesOnRoad: 3, status: 'active', trackPassFare: 1 });
  });

  it('counts a parked jeep once, and leaves out jeeps far from the route', () => {
    const card = toTransitRoute(route(), [jeep(10.31, undefined, 0), jeep(10.31, 0, 8, LNG + 0.05)]);
    expect(card.vehiclesOnRoad).toBe(1);
  });

  it('is offline and free with no jeep on the road', () => {
    expect(toTransitRoute(route(), [])).toMatchObject({ vehiclesOnRoad: 0, status: 'offline', trackPassFare: 0 });
  });

  it('shows the route details, with nothing about arrival times', () => {
    const card = toTransitRoute(route(), []);
    expect(card).toMatchObject({
      code: '17B',
      name: 'Apas ⇄ Sto. Niño',
      via: 'Apas → Sto. Niño via Lahug',
      distance: '14.8 km',
      stops: 4,
      baseFare: 15,
      vehicleType: 'jeepney',
    });
    expect(JSON.stringify(card)).not.toMatch(/ETA|approach/i);
  });

  it('measures the road when the portal has no round-trip length', () => {
    const line = outbound.map((s) => ({ latitude: s.lat, longitude: s.lng }));
    const paths = { outbound: buildPath(line), inbound: buildPath([...line].reverse()) };
    expect(toTransitRoute(route({ roundtripKm: 0 }), [], paths).distance).toBe('6.7 km');
    expect(toTransitRoute(route({ roundtripKm: 0 }), []).distance).toBe('');
  });
});

describe('hubFilterOptions', () => {
  it('counts live vehicles on the road, not routes', () => {
    const cards = [
      { ...toTransitRoute(route(), []), vehiclesOnRoad: 1 },
      toTransitRoute(route({ id: 'r2', code: '04L' }), []),
      toTransitRoute(route({ id: 'r3', code: '14D' }), []),
    ];
    // Three routes listed, one jeepney live.
    expect(hubFilterOptions(cards).map((o) => o.label)).toEqual([
      'All Transit (1)',
      'Jeepneys Only (1)',
      'Buses Only (0)',
    ]);
  });

  it('adds up vehicles across routes and types', () => {
    const cards = [
      { ...toTransitRoute(route(), []), vehiclesOnRoad: 2 },
      { ...toTransitRoute(route({ id: 'r2' }), []), vehiclesOnRoad: 3 },
      { ...toTransitRoute(route({ id: 'r3' }), []), vehicleType: 'bus' as const, vehiclesOnRoad: 1 },
    ];
    expect(hubFilterOptions(cards).map((o) => o.label)).toEqual([
      'All Transit (6)',
      'Jeepneys Only (5)',
      'Buses Only (1)',
    ]);
  });
});
