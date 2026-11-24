import type { Route } from '@packages/tanstack/query/routes';

import {
  ACROSS_TURN_M,
  approachGap,
  approachSegments,
  boardingPoints,
  buildCommuteOptions,
  earlyBoardLane,
  isIncoming,
  jeepPose,
  orderNearby,
  pickupPoint,
  pickupText,
  jeepIncoming,
  nearestLane,
  onSharedStreet,
  pinDirection,
  placeLiveJeep,
  routeEta,
  routesOnMyWay,
  seatsText,
  turnaroundTail,
  turnsInto,
} from './commuteOptions';
import { buildPath, slicePath } from './livePath';
import type { LiveJeep } from './useLiveCorridor';

// A straight north-south street: one degree of latitude is ~111 km, so 0.001° ≈ 111 m.
const LNG = 123.9;
const stop = (name: string, lat: number, lng = LNG) => ({ id: name, name, kind: 'stop', lat, lng });

/** Outbound runs north (10.300 → 10.330); inbound runs back south on the same street. */
const makeRoute = (id: string, code: string, lng = LNG): Route => ({
  id,
  code,
  name: code,
  status: 'active',
  directions: {
    outbound: {
      label: 'Northbound',
      via: '',
      waypoints: [stop('S0', 10.3, lng), stop('S1', 10.31, lng), stop('S2', 10.32, lng), stop('S3', 10.33, lng)],
    },
    inbound: {
      label: 'Southbound',
      via: '',
      waypoints: [stop('N3', 10.33, lng), stop('N2', 10.32, lng), stop('N1', 10.31, lng), stop('N0', 10.3, lng)],
    },
  },
});

const jeep = (lat: number, heading?: number, speed?: number, lng = LNG): LiveJeep => ({
  driverId: `d-${lat}-${heading}`,
  unitCode: 'U',
  plate: 'P',
  coordinate: { latitude: lat, longitude: lng },
  heading,
  speed,
  at: 0,
});

const me = { latitude: 10.32, longitude: LNG + 0.001 }; // ~110 m east of S2 / N2

describe('routesOnMyWay', () => {
  it('keeps routes with a stop within walking distance of the commuter', () => {
    const near = makeRoute('a', 'A');
    const far = makeRoute('b', 'B', LNG + 0.05); // ~5.5 km east
    expect(routesOnMyWay([near, far], me).map((r) => r.code)).toEqual(['A']);
  });

  it('keeps every route when the location is unknown', () => {
    expect(routesOnMyWay([makeRoute('a', 'A'), makeRoute('b', 'B', LNG + 0.05)], undefined)).toHaveLength(2);
  });
});

describe('routeEta', () => {
  const route = makeRoute('a', 'A');

  it('times a moving jeep heading to the boarding stop', () => {
    // 10.311 → S2 at 10.32 is ~1 km north: ~3 min at 300 m/min.
    const eta = routeEta(route, [jeep(10.311, 0, 8)], me);
    expect(eta).toMatchObject({ live: 1, approaching: 1, minutes: 3, board: { name: 'S2', direction: 'outbound' } });
  });

  it('names the nearest approaching jeep for the arrival card (live-arrival-card)', () => {
    const far = { ...jeep(10.305, 0, 8), driverId: 'far', plate: 'FAR-1', unitCode: 'U-FAR' };
    const near = { ...jeep(10.315, 0, 8), driverId: 'near', plate: 'GMD-1782', unitCode: 'PARA-0006' };
    expect(routeEta(route, [far, near], me, undefined, 'outbound').nextJeep).toEqual({
      driverId: 'near',
      plate: 'GMD-1782',
      unitCode: 'PARA-0006',
    });
    expect(routeEta(route, [jeep(10.325, 0, 8)], me, undefined, 'outbound').nextJeep).toBeUndefined();
  });

  it('lists every jeep on the route, coming ones soonest first (route-units)', () => {
    const near = { ...jeep(10.315, 0, 8), driverId: 'near' };
    const far = { ...jeep(10.305, 0, 8), driverId: 'far' };
    const passed = { ...jeep(10.325, 0, 8), driverId: 'passed' };
    const units = routeEta(route, [passed, far, near], me, undefined, 'outbound').units ?? [];
    expect(units.map((u) => [u.driverId, u.coming])).toEqual([
      ['near', true],
      ['far', true],
      ['passed', false],
    ]);
    expect(units[0].minutes).toBeLessThan(units[1].minutes as number);
    // The first row is the same jeep as the arrival card's.
    expect(units[0].driverId).toBe(routeEta(route, [passed, far, near], me, undefined, 'outbound').nextJeep?.driverId);
  });

  it('leaves out a moving jeep that already passed the stop', () => {
    expect(routeEta(route, [jeep(10.325, 0, 8)], me, undefined, 'outbound')).toMatchObject({ live: 1, approaching: 0, minutes: undefined });
  });

  it('times the return direction for a jeep coming back', () => {
    // Heading south from 10.329 to N2 at 10.32: ~1 km.
    const eta = routeEta(route, [jeep(10.329, 180, 8)], me);
    expect(eta).toMatchObject({ approaching: 1, minutes: 3, board: { name: 'N2', direction: 'inbound' } });
  });

  it('counts a parked jeep on its closest lane only, the same as the map icon', () => {
    // Both lanes are the same street here, so the closest is the first one listed (outbound), where it has passed S2.
    expect(routeEta(route, [jeep(10.326, 0, 0)], me, undefined, 'outbound')).toMatchObject({ live: 1, approaching: 0 });
  });

  it('has no ETA without the commuter location', () => {
    expect(routeEta(route, [jeep(10.311, 0, 8)], undefined)).toEqual({ live: 1, approaching: 0 });
  });

  it('ignores jeeps far from the route', () => {
    expect(routeEta(route, [jeep(10.311, 0, 8, LNG + 0.02)], me).approaching).toBe(0);
  });
});

describe('buildCommuteOptions', () => {
  const preferred = makeRoute('p', '17B');
  const soon = makeRoute('s', '17C');
  const idle = makeRoute('i', '04L');
  const far = makeRoute('f', '99X', LNG + 0.05);

  it('lists the preferred route and routes on the way, soonest first, with badges', () => {
    const options = buildCommuteOptions(
      preferred,
      [idle, soon, far],
      { p: [jeep(10.301, 0, 8)], s: [jeep(10.315, 0, 8)] },
      me,
    );
    expect(options.map((o) => [o.code, o.badge, o.eta])).toEqual([
      ['17C', 'BEST OPTION', '2 min'],
      ['17B', 'YOUR PREFERRED ROUTE', '7 min'],
      ['04L', 'ALTERNATIVE', '—'],
    ]);
    expect(options[0]).toMatchObject({ routeId: 's', tone: 'best', subtitle: '1 vehicle approaching' });
    expect(options[2]).toMatchObject({ subtitle: 'No live jeeps yet', etaCaption: 'NO ETA' });
  });

  it('gives no BEST OPTION when the preferred route is soonest', () => {
    const options = buildCommuteOptions(preferred, [soon], { p: [jeep(10.318, 0, 8)], s: [jeep(10.305, 0, 8)] }, me);
    expect(options.map((o) => [o.code, o.tone])).toEqual([
      ['17B', 'preferred'],
      ['17C', 'alternative'],
    ]);
  });

  it('says when jeeps are live but none is coming to the stop', () => {
    const [option] = buildCommuteOptions(preferred, [], { p: [jeep(10.325, 0, 8)] }, me, {}, 'outbound');
    expect(option.subtitle).toBe('1 jeep live, none heading to your stop yet');
  });

  it('still lists the routes on the way when the preferred route is not running', () => {
    expect(buildCommuteOptions(null, [soon], {}, me).map((o) => o.code)).toEqual(['17C']);
  });
});

describe('incoming or passed (map icon colour)', () => {
  const route = makeRoute('a', 'A');
  const line = (key: 'outbound' | 'inbound') =>
    route.directions[key].waypoints.map((w) => ({ latitude: w.lat, longitude: w.lng }));
  const paths = { outbound: buildPath(line('outbound')), inbound: buildPath(line('inbound')) };
  const named = {
    outbound: route.directions.outbound.waypoints.map((w) => ({
      name: w.name,
      coordinate: { latitude: w.lat, longitude: w.lng },
    })),
    inbound: route.directions.inbound.waypoints.map((w) => ({
      name: w.name,
      coordinate: { latitude: w.lat, longitude: w.lng },
    })),
  };
  const boards = boardingPoints(named, paths, me);

  it('finds the boarding stop on each direction', () => {
    expect(boards.outbound?.name).toBe('S2');
    expect(boards.inbound?.name).toBe('N2');
  });

  it('is incoming before the stop and passed after it, per direction', () => {
    const north = boardingPoints(named, paths, me, 'outbound');
    const south = boardingPoints(named, paths, me, 'inbound');
    expect(jeepIncoming(paths, jeep(10.311, 0, 8), north)).toBe(true); // northbound, south of S2
    expect(jeepIncoming(paths, jeep(10.325, 0, 8), north)).toBe(false); // northbound, past S2
    expect(jeepIncoming(paths, jeep(10.325, 180, 8), south)).toBe(true); // southbound, north of N2
    expect(jeepIncoming(paths, jeep(10.311, 180, 8), south)).toBe(false); // southbound, past N2
  });

  // waiting-pin both ways: a northbound jeep past S2 turns round at the end (~560 m) and reaches N2 (~1.1 km) on the
  // way back, so with both directions open it is still coming.
  it('counts a jeep coming round the turnaround with both directions open', () => {
    expect(jeepIncoming(paths, jeep(10.325, 0, 8), boards)).toBe(true);
    // Southbound past N2, then ~1.2 km to the far end and ~2.2 km back up to S2: over 3 km, not coming.
    expect(jeepIncoming(paths, jeep(10.311, 180, 8), boards)).toBe(false);
  });

  it('still counts a jeep at the stop as incoming, and none without a stop nearby', () => {
    expect(isIncoming('outbound', (boards.outbound?.along ?? 0) + 20, boards)).toBe(true);
    expect(isIncoming('outbound', 0, {})).toBe(false);
  });

  it('agrees with the route list', () => {
    const jeeps = [jeep(10.311, 0, 8), jeep(10.325, 0, 8), jeep(10.325, 180, 8)];
    const incoming = jeeps.filter((j) => jeepIncoming(paths, j, boards)).length;
    expect(routeEta(route, jeeps, me, paths).approaching).toBe(incoming);
  });
});

describe('the commuter direction of travel (Revision 13)', () => {
  const route = makeRoute('a', 'A');
  const line = (key: 'outbound' | 'inbound') =>
    route.directions[key].waypoints.map((w) => ({ latitude: w.lat, longitude: w.lng }));
  const paths = { outbound: buildPath(line('outbound')), inbound: buildPath(line('inbound')) };
  const named = {
    outbound: route.directions.outbound.waypoints.map((w) => ({
      name: w.name,
      coordinate: { latitude: w.lat, longitude: w.lng },
    })),
    inbound: route.directions.inbound.waypoints.map((w) => ({
      name: w.name,
      coordinate: { latitude: w.lat, longitude: w.lng },
    })),
  };
  const north = jeep(10.311, 0, 8); // northbound, before S2
  const south = jeep(10.325, 180, 8); // southbound, before N2

  it('boards only on the chosen direction', () => {
    expect(Object.keys(boardingPoints(named, paths, me, 'outbound'))).toEqual(['outbound']);
    expect(Object.keys(boardingPoints(named, paths, me, 'inbound'))).toEqual(['inbound']);
  });

  it("counts only jeeps coming the commuter's way", () => {
    expect(routeEta(route, [north, south], me, paths, 'outbound')).toMatchObject({ approaching: 1, minutes: 3 });
    expect(routeEta(route, [north, south], me, paths, 'inbound')).toMatchObject({ approaching: 1, minutes: 2 });
    const boards = boardingPoints(named, paths, me, 'outbound');
    expect(jeepIncoming(paths, north, boards, 'outbound')).toBe(true);
    expect(jeepIncoming(paths, south, boards, 'outbound')).toBe(false); // the other way: grey
  });

  it("puts a parked jeep on the commuter's lane when both lanes are the same road", () => {
    const parked = jeep(10.311, undefined, 0);
    expect(placeLiveJeep(paths, parked, 'inbound')?.key).toBe('inbound');
    expect(placeLiveJeep(paths, parked, 'outbound')?.key).toBe('outbound');
  });
});

describe('switching direction never moves a jeep (Revision 14)', () => {
  const route = makeRoute('a', 'A');
  const line = (key: 'outbound' | 'inbound') =>
    route.directions[key].waypoints.map((w) => ({ latitude: w.lat, longitude: w.lng }));
  const paths = { outbound: buildPath(line('outbound')), inbound: buildPath(line('inbound')) };

  it('keeps each jeep on the same lane whichever way the commuter goes', () => {
    for (const j of [jeep(10.311, undefined, 0), jeep(10.311, 0, 8), jeep(10.325, 180, 8)]) {
      const lane = placeLiveJeep(paths, j)?.key;
      for (const direction of ['outbound', 'inbound'] as const) {
        const eta = routeEta(route, [j], me, paths, direction);
        expect(eta.approaching === 1 ? direction : undefined).toBe(eta.approaching === 1 ? lane : undefined);
      }
    }
  });
});

describe('jeepPose: on the road when close, exact when far (Revision 15)', () => {
  const route = makeRoute('a', 'A');
  const line = (key: 'outbound' | 'inbound') =>
    route.directions[key].waypoints.map((w) => ({ latitude: w.lat, longitude: w.lng }));
  const paths = { outbound: buildPath(line('outbound')), inbound: buildPath(line('inbound')) };

  it('draws a fix ~20 m off the road on the road, facing along it', () => {
    const pose = jeepPose(paths, jeep(10.311, 10, 8, LNG + 0.0002));
    expect(pose.snapped).toBe(true);
    expect(pose.coordinate.longitude).toBeCloseTo(LNG, 6);
    expect(pose.coordinate.latitude).toBeCloseTo(10.311, 4);
    expect(pose.bearing).toBeCloseTo(0, 0); // the road runs north; the GPS said 10°
  });

  it('draws a fix ~110 m off the road exactly where it is, with its GPS heading', () => {
    const pose = jeepPose(paths, jeep(10.311, 45, 8, LNG + 0.001));
    expect(pose).toEqual({ coordinate: { latitude: 10.311, longitude: LNG + 0.001 }, bearing: 45, snapped: false });
  });
});

describe('orderNearby (Revision 16)', () => {
  const a = makeRoute('a', '04L');
  const b = makeRoute('b', '17B');
  const c = makeRoute('c', '14D');

  it('keeps the geofence order (nearest first) and only picks out the preferred route', () => {
    const { preferred, routes } = orderNearby([a, b, c], '17b');
    expect(preferred?.code).toBe('17B');
    expect(routes.map((r) => r.code)).toEqual(['04L', '17B', '14D']);
  });

  it('keeps every geofence route, even one whose stops are all far away', () => {
    const far = makeRoute('f', '17C', LNG + 0.05); // stops ~5.5 km away, but the backend said its line is near
    const options = buildCommuteOptions(b, [a, far], {}, me, {}, undefined, [a, b, far]);
    expect(options.map((o) => o.code)).toEqual(['04L', '17B', '17C']);
  });

  it('keeps the nearest-first order in the route list, whatever the ETAs', () => {
    // 17B (preferred) has a jeep coming; 04L is nearest but has none.
    const options = buildCommuteOptions(b, [a, c], { b: [jeep(10.311, 0, 8)] }, me, {}, undefined, [a, b, c]);
    expect(options.map((o) => o.code)).toEqual(['04L', '17B', '14D']);
    expect(options[1]).toMatchObject({ badge: 'YOUR PREFERRED ROUTE', eta: '3 min' });
  });

  it('lists only nearby routes when the preferred one is not among them', () => {
    const { preferred, routes } = orderNearby([a, c], '17B');
    expect(preferred).toBeUndefined();
    expect(routes.map((r) => r.code)).toEqual(['04L', '14D']);
  });
});

// The backend falls back to the nearest routes when none passes close (temporary): their stops can be far away, and
// the ₱1 view still counts jeepneys coming to the nearest stop.
describe('a route that is not close to the commuter', () => {
  const route = makeRoute('far', '17B');
  const line = (key: 'outbound' | 'inbound') =>
    route.directions[key].waypoints.map((w) => ({ latitude: w.lat, longitude: w.lng }));
  const paths = { outbound: buildPath(line('outbound')), inbound: buildPath(line('inbound')) };
  const named = {
    outbound: route.directions.outbound.waypoints.map((w) => ({
      name: w.name,
      coordinate: { latitude: w.lat, longitude: w.lng },
    })),
    inbound: route.directions.inbound.waypoints.map((w) => ({
      name: w.name,
      coordinate: { latitude: w.lat, longitude: w.lng },
    })),
  };
  // ~1.1 km east of the street.
  const farMe = { latitude: me.latitude, longitude: LNG + 0.01 };

  it('still boards at the nearest stop, however far', () => {
    const boards = boardingPoints(named, paths, farMe);
    expect(boards.outbound?.name).toBe('S2');
    expect(boards.outbound?.distance).toBeGreaterThan(1000);
  });

  it('lists the route for free with its incoming jeepneys, or none yet', () => {
    expect(routeEta(route, [jeep(10.311, 0, 8)], farMe, paths)).toMatchObject({ approaching: 1 });
    const [option] = buildCommuteOptions(undefined, [route], {}, farMe, {}, undefined, [route]);
    expect(option).toMatchObject({ code: '17B' });
  });
});

// Jeepneys pick up along the road: a commuter standing on it boards right there, not at the nearest stop behind
// them (the same rule the backend uses to share the ₱1).
describe('a commuter standing on the road between stops', () => {
  const route = makeRoute('r', '17B');
  const line = (key: 'outbound' | 'inbound') =>
    route.directions[key].waypoints.map((w) => ({ latitude: w.lat, longitude: w.lng }));
  const paths = { outbound: buildPath(line('outbound')), inbound: buildPath(line('inbound')) };
  const onRoad = { latitude: 10.313, longitude: LNG }; // ~330 m past S1, the nearest stop
  const coming = jeep(10.311, 0, 8); // passed S1, still coming to the commuter
  const passed = jeep(10.315, 0, 8);

  it('counts a jeepney between the stop and the commuter as approaching', () => {
    expect(routeEta(route, [coming, passed], onRoad, paths, 'outbound')).toMatchObject({ approaching: 1, minutes: 1 });
  });

  it('draws it as incoming and the one that passed the commuter as passed', () => {
    const named = {
      outbound: route.directions.outbound.waypoints.map((w) => ({
        name: w.name,
        coordinate: { latitude: w.lat, longitude: w.lng },
      })),
      inbound: route.directions.inbound.waypoints.map((w) => ({
        name: w.name,
        coordinate: { latitude: w.lat, longitude: w.lng },
      })),
    };
    const boards = boardingPoints(named, paths, onRoad, 'outbound');
    expect(boards.outbound?.name).toBe('S1'); // still named after the nearest stop
    expect(jeepIncoming(paths, coming, boards)).toBe(true);
    expect(jeepIncoming(paths, passed, boards)).toBe(false);
  });
});

describe('the map callout: where to board', () => {
  const route = makeRoute('r', '17B');
  const stops = route.directions.outbound.waypoints.map((w) => ({
    name: w.name,
    coordinate: { latitude: w.lat, longitude: w.lng },
  }));
  const path = buildPath(stops.map((s) => s.coordinate));

  it('on the road: board right here, not at the stop behind', () => {
    const pickup = pickupPoint(stops, path, { latitude: 10.313, longitude: LNG });
    expect(pickup).toMatchObject({ onRoad: true, name: 'S1' });
    expect(pickup?.coordinate.latitude).toBeCloseTo(10.313, 4);
    expect(pickupText(pickup!, 'Northbound')).toEqual({
      title: 'Board here, on the route',
      detail: "You're on the road • Northbound",
    });
  });

  it('near the road: says how far the road is', () => {
    const pickup = pickupPoint(stops, path, { latitude: 10.313, longitude: LNG + 0.001 }); // ~110 m east
    expect(pickup?.onRoad).toBe(true);
    expect(pickupText(pickup!).detail).toBe('110 m to the road');
  });

  it('far from the road: the nearest stop and the walk, as before', () => {
    const pickup = pickupPoint(stops, path, { latitude: 10.313, longitude: LNG + 0.005 }); // ~550 m east
    expect(pickup).toMatchObject({ onRoad: false, name: 'S1' });
    expect(pickupText(pickup!).title).toBe('Board at S1');
    expect(pickupText(pickup!).detail).toMatch(/^\d+ m • \d+ min walk$/);
  });

  it('before the road is known: the nearest stop', () => {
    expect(pickupPoint(stops, undefined, { latitude: 10.313, longitude: LNG })?.onRoad).toBe(false);
  });
});

// Vacant seats (Revision 21 load, shown to commuters): the nearest approaching jeep's.
describe('vacant seats on the route card', () => {
  const route = makeRoute('a', '17B');
  const line = (key: 'outbound' | 'inbound') =>
    route.directions[key].waypoints.map((w) => ({ latitude: w.lat, longitude: w.lng }));
  const paths = { outbound: buildPath(line('outbound')), inbound: buildPath(line('inbound')) };
  const near = { ...jeep(10.311, 0, 8), driverId: 'near', seats: { free: 4, capacity: 22 } };
  const far = { ...jeep(10.302, 0, 8), driverId: 'far', seats: { free: 20, capacity: 22 } };

  it("shows the nearest approaching jeep's free seats", () => {
    expect(routeEta(route, [far, near], me, paths, 'outbound')).toMatchObject({ approaching: 2, seatsFree: 4 });
    const [option] = buildCommuteOptions(route, [], { a: [far, near] }, me, { a: paths }, 'outbound');
    expect(option.subtitle).toBe('2 vehicles approaching • 4 seats free');
  });

  it('says Full, or nothing when the driver has not set the load', () => {
    const full = { ...near, seats: { free: 0, capacity: 22 } };
    expect(buildCommuteOptions(route, [], { a: [full] }, me, { a: paths }, 'outbound')[0].subtitle).toBe(
      '1 vehicle approaching • Full',
    );
    const unknown = { ...near, seats: undefined };
    expect(buildCommuteOptions(route, [], { a: [unknown] }, me, { a: paths }, 'outbound')[0].subtitle).toBe(
      '1 vehicle approaching',
    );
    expect(seatsText(1)).toBe('1 seat free');
  });
});

// turnaround-approach: Northbound ends at S3 (10.330), where Southbound starts (N3), so northbound jeeps near the end
// turn around and come to a commuter waiting just after it on Southbound.
describe('across the turnaround', () => {
  const route = makeRoute('a', 'A');
  const named = {
    outbound: route.directions.outbound.waypoints.map((w) => ({
      name: w.name,
      coordinate: { latitude: w.lat, longitude: w.lng },
    })),
    inbound: route.directions.inbound.waypoints.map((w) => ({
      name: w.name,
      coordinate: { latitude: w.lat, longitude: w.lng },
    })),
  };
  const paths = {
    outbound: buildPath(named.outbound.map((s) => s.coordinate)),
    inbound: buildPath(named.inbound.map((s) => s.coordinate)),
  };
  const nearEnd = { latitude: 10.328, longitude: LNG + 0.001 }; // on the road, ~220 m into Southbound
  const boards = boardingPoints(named, paths, nearEnd, 'inbound');

  it('joins the directions at the turnaround', () => {
    expect(turnsInto(paths, 'outbound', 'inbound')).toBe(true);
    const oneWay = { ...paths, outbound: buildPath(named.outbound.slice(0, 3).map((s) => s.coordinate)) };
    expect(turnsInto(oneWay, 'outbound', 'inbound')).toBe(false);
  });

  it('counts the other direction near its end, up to 3 km of road', () => {
    // 10.310 → S3 is ~2.2 km, then ~220 m: ~2.4 km.
    const round = approachGap(paths, { key: 'outbound', distance: 1113 }, boards);
    expect(round?.key).toBe('inbound');
    expect(round?.gap).toBeGreaterThan(2400);
    expect(round?.gap).toBeLessThanOrEqual(ACROSS_TURN_M);
    expect(approachGap(paths, { key: 'outbound', distance: 200 }, boards)).toBeUndefined(); // ~3.1 km
    expect(jeepIncoming(paths, jeep(10.31, 0, 8), boards)).toBe(true);
    expect(jeepIncoming(paths, jeep(10.32, 180, 8), boards)).toBe(false); // Southbound, past the commuter
  });

  it('times the jeep coming round in the ETA', () => {
    const eta = routeEta(route, [jeep(10.31, 0, 8)], nearEnd, undefined, 'inbound');
    expect(eta).toMatchObject({ approaching: 1, minutes: 8, board: { direction: 'inbound' } });
  });

  it('crosses either way when both directions are open (waiting pin)', () => {
    const both = boardingPoints(named, paths, nearEnd);
    expect(approachGap(paths, { key: 'outbound', distance: 1000 }, both)?.key).toBe('outbound');
    // Past the commuter on Northbound: comes round to them on Southbound.
    expect(approachGap(paths, { key: 'outbound', distance: paths.outbound.length - 50 }, both)?.key).toBe('inbound');
    // Southbound far past them: over 3 km back round, not coming.
    expect(approachGap(paths, { key: 'inbound', distance: 2000 }, both)).toBeUndefined();
  });

  it('draws orange up to the boarding point and across the turnaround only', () => {
    const segs = approachSegments(paths, boards);
    expect(segs).toHaveLength(2);
    // Southbound up to the commuter, then the last stretch of Northbound before the turnaround.
    expect(segs[0]).toMatchObject({ key: 'inbound', from: 0, to: boards.inbound?.along });
    expect(segs[1]).toMatchObject({ key: 'outbound', to: paths.outbound.length });
    expect(paths.outbound.length - segs[1].from).toBeCloseTo(ACROSS_TURN_M - (boards.inbound?.along ?? 0), 0);
    expect(slicePath(paths.inbound, 0, boards.inbound?.along ?? 0).length).toBeGreaterThan(1);
  });
});

// Too far to wait: a jeep over 3 km of road from the boarding point is grey, like one that passed.
describe('too far to wait', () => {
  const route = makeRoute('a', 'A');
  const nearEnd = { latitude: 10.3295, longitude: LNG }; // on the road, ~3.3 km into Northbound
  it('greys out a jeep over 3 km of road away, and keeps a nearer one', () => {
    const eta = routeEta(route, [jeep(10.3018, 0, 8), jeep(10.31, 0, 8)], nearEnd, undefined, 'outbound');
    expect(eta.approaching).toBe(1);
    expect(eta.units?.find((u) => u.driverId === 'd-10.3018-0')?.coming).toBe(false);
  });
});

// waiting-pin lane: with a pin, only the side of the street the pin is on counts (and is coloured).
describe("the pin's lane", () => {
  const route = makeRoute('a', 'A');
  // Northbound runs on the west side of the street, Southbound on the east side (100 m apart).
  const westEast = {
    outbound: buildPath([
      { latitude: 10.3, longitude: LNG },
      { latitude: 10.33, longitude: LNG },
    ]),
    inbound: buildPath([
      { latitude: 10.33, longitude: LNG + 0.001 },
      { latitude: 10.3, longitude: LNG + 0.001 },
    ]),
  };

  it('picks the direction whose road is nearest the pin', () => {
    expect(nearestLane(westEast, { latitude: 10.315, longitude: LNG - 0.0002 })).toBe('outbound');
    expect(nearestLane(westEast, { latitude: 10.315, longitude: LNG + 0.0012 })).toBe('inbound');
  });

  it('counts both lanes only near the end of the lane, where the other direction starts', () => {
    // 100 m apart and joined at the north end. ~450 m before the end: near the end, both lanes.
    expect(pinDirection(westEast, { latitude: 10.326, longitude: LNG + 0.0004 })).toBeUndefined();
    // ~2.2 km before the end: far from it, the pin's lane only, though the other road is close.
    expect(pinDirection(westEast, { latitude: 10.31, longitude: LNG + 0.0002 })).toBe('outbound');
    const farApart = { ...westEast, inbound: buildPath([
      { latitude: 10.33, longitude: LNG + 0.004 },
      { latitude: 10.3, longitude: LNG + 0.004 },
    ]) }; // ~440 m apart
    expect(pinDirection(farApart, { latitude: 10.315, longitude: LNG - 0.0002 })).toBe('outbound');
  });

  it('counts jeeps coming on either lane when the pin is near the end and close to both', () => {
    const nearEnd = { latitude: 10.326, longitude: LNG + 0.0004 };
    // Northbound coming up to the end, and Southbound just after the turnaround, before the pin.
    const eta = routeEta(route, [jeep(10.311, 0, 8), jeep(10.329, 180, 8, LNG + 0.001)], nearEnd, westEast, 'nearestLane');
    expect(eta.approaching).toBe(2);
  });

  it("counts only jeeps coming on the pin's lane", () => {
    const pin = { latitude: 10.32, longitude: LNG - 0.0002 }; // west side: Northbound
    // Roads ~440 m apart, so the pin is close to Northbound only.
    const apart = { ...westEast, inbound: buildPath([
      { latitude: 10.33, longitude: LNG + 0.004 },
      { latitude: 10.3, longitude: LNG + 0.004 },
    ]) };
    const eta = routeEta(route, [jeep(10.311, 0, 8), jeep(10.325, 180, 8, LNG + 0.004)], pin, apart, 'nearestLane');
    expect(eta).toMatchObject({ approaching: 1, board: { direction: 'outbound' } });
  });
});

// turnaround-tail: a pin near the start of the picked direction colours the last 1 km of the other direction.
describe('turnaround tail', () => {
  // Northbound ends at the north end, where Southbound starts (~110 m apart).
  const paths = {
    outbound: buildPath([
      { latitude: 10.3, longitude: LNG },
      { latitude: 10.33, longitude: LNG },
    ]),
    inbound: buildPath([
      { latitude: 10.33, longitude: LNG + 0.001 },
      { latitude: 10.3, longitude: LNG + 0.001 },
    ]),
  };

  it('is the last 2 km of Northbound when the pin is near the start of Southbound', () => {
    const pin = { latitude: 10.327, longitude: LNG + 0.001 }; // ~330 m into Southbound
    const tail = turnaroundTail(paths, pin, 'inbound');
    expect(tail?.key).toBe('outbound');
    expect(tail?.to).toBeCloseTo(paths.outbound.length);
    expect((tail?.to ?? 0) - (tail?.from ?? 0)).toBeCloseTo(2000);
  });

  it('is nothing (default colours) further from the start, or off the road', () => {
    expect(turnaroundTail(paths, { latitude: 10.31, longitude: LNG + 0.001 }, 'inbound')).toBeUndefined(); // ~2.2 km in
    expect(turnaroundTail(paths, { latitude: 10.327, longitude: LNG + 0.004 }, 'inbound')).toBeUndefined(); // ~330 m off
  });

  it('works the other way round (likewise from Going back)', () => {
    const pin = { latitude: 10.302, longitude: LNG }; // ~220 m into Northbound, after the south turnaround
    expect(turnaroundTail(paths, pin, 'outbound')?.key).toBe('inbound');
  });
});

// early-boarding: picked Southbound, but the pin is on Northbound's road before the north turnaround: board there
// early and ride round it (more vacant seats).
describe('early boarding', () => {
  const route = makeRoute('a', 'A');
  // Northbound on the west side, Southbound ~440 m east; they join at the north end.
  const paths = {
    outbound: buildPath([
      { latitude: 10.3, longitude: LNG },
      { latitude: 10.33, longitude: LNG },
    ]),
    inbound: buildPath([
      { latitude: 10.33, longitude: LNG + 0.001 },
      { latitude: 10.33, longitude: LNG + 0.004 },
      { latitude: 10.3, longitude: LNG + 0.004 },
    ]),
  };
  // ~1.1 km before Northbound's end (the north turnaround).
  const onNorthbound = { latitude: 10.32, longitude: LNG + 0.0003 };

  it('boards on the direction that turns into the picked one when the pin is on its road', () => {
    expect(earlyBoardLane(paths, onNorthbound, 'inbound')).toBe('outbound');
    expect(pinDirection(paths, onNorthbound, 'inbound')).toBe('outbound');
    // On the picked road itself: no early boarding.
    expect(earlyBoardLane(paths, { latitude: 10.315, longitude: LNG + 0.004 }, 'inbound')).toBeUndefined();
    // Off both roads: none either.
    expect(earlyBoardLane(paths, { latitude: 10.315, longitude: LNG + 0.002 }, 'inbound')).toBeUndefined();
    // On Northbound's road (one direction there) far from its end (~2.8 km): still boards early.
    expect(earlyBoardLane(paths, { latitude: 10.305, longitude: LNG + 0.0003 }, 'inbound')).toBe('outbound');
  });

  it('times the Northbound jeep coming to the pin, not Southbound ones', () => {
    const eta = routeEta(
      route,
      [jeep(10.31, 0, 8), jeep(10.32, 180, 8, LNG + 0.004)],
      onNorthbound,
      paths,
      'pin:inbound',
    );
    expect(eta).toMatchObject({ approaching: 1, board: { direction: 'outbound' } });
  });
});

// shared-street: on a street both directions use, only the picked direction counts and no extension is drawn.
describe('shared street', () => {
  // Both directions on the same street (a few metres apart), joined at both ends.
  const same = {
    outbound: buildPath([
      { latitude: 10.3, longitude: LNG },
      { latitude: 10.33, longitude: LNG },
    ]),
    inbound: buildPath([
      { latitude: 10.33, longitude: LNG + 0.0001 },
      { latitude: 10.3, longitude: LNG + 0.0001 },
    ]),
  };
  const nearNorthEnd = { latitude: 10.327, longitude: LNG + 0.00005 };

  it('knows the pin is on a shared street', () => {
    expect(onSharedStreet(same, nearNorthEnd)).toBe(true);
    expect(onSharedStreet(same, { latitude: 10.327, longitude: LNG + 0.002 })).toBe(false);
  });

  it('keeps only the picked direction there: no early boarding, no tail, no both-ways', () => {
    expect(earlyBoardLane(same, nearNorthEnd, 'inbound')).toBeUndefined();
    expect(turnaroundTail(same, nearNorthEnd, 'inbound')).toBeUndefined();
    expect(pinDirection(same, nearNorthEnd, 'inbound')).toBe('inbound');
    expect(pinDirection(same, nearNorthEnd, 'outbound')).toBe('outbound');
  });
});
