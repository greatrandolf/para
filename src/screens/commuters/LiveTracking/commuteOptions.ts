import type { LatLng } from 'react-native-maps';

import type { RouteOption } from '@/types/commuter';
import type { DirectionKey, Route } from '@packages/tanstack/query/routes';

import {
  WALK_M_PER_MIN,
  buildPath,
  distanceM,
  nearestStop,
  pickDirection,
  poseAlong,
  project,
  type RoutePath,
} from './livePath';
import type { LiveJeep } from './useLiveCorridor';

/** A route counts as "on my way" when one of its stops is this close to the commuter. */
export const ON_MY_WAY_M = 800;

/** 643 -> "640 m", 1145 -> "1.1 km". */
export const distanceText = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);

/** Average jeepney speed in city traffic, stops included (18 km/h). */
export const JEEP_M_PER_MIN = 300;

/** A jeep further than this from a direction's line is not on it (straight stop lines cut corners). */
const ON_LINE_M = 500;

/**
 * A commuter this close to a direction's road boards where they stand, not at the nearest stop (the backend's
 * BOARD_ON_ROAD_M, so the map, the ETA and the ₱1 sharing agree on which jeepneys are coming).
 */
export const BOARD_ON_ROAD_M = 200;

/** A jeep this far past the boarding stop still counts as arriving (GPS noise at the stop). */
const AT_STOP_M = 30;

const DIRECTIONS: DirectionKey[] = ['outbound', 'inbound'];
const otherWay = (key: DirectionKey): DirectionKey => (key === 'outbound' ? 'inbound' : 'outbound');

/**
 * turnaround-approach: one direction "turns into" the other when its end is this close to the other's start (the
 * turnaround). A jeep finishing it keeps going as the other direction.
 */
export const TURN_JOIN_M = 300;
/**
 * A jeep this many road metres from the boarding point (or nearer) counts as coming, on the same direction or across
 * the turnaround (~10 min at JEEP_M_PER_MIN). Further away it is "too far to wait": grey, not in the ETA, and it does
 * not share the ₱1 (the backend's MAX_WAIT_M).
 */
export const ACROSS_TURN_M = 3_000;
/** The same limit, by its meaning for jeeps on the commuter's own direction. */
export const MAX_WAIT_M = ACROSS_TURN_M;

const coord = (w: { lat: number; lng: number }): LatLng => ({ latitude: w.lat, longitude: w.lng });

const stopsOf = (route: Route, key: DirectionKey) =>
  (route.directions[key]?.waypoints ?? []).map((w) => ({ name: w.name, coordinate: coord(w) }));

/**
 * The geofence result (`routesNearby`), kept nearest first. The commuter's preferred route is picked out (for its
 * badge) but not moved: the list is sorted by distance only.
 */
export function orderNearby(nearby: readonly Route[], preferredCode: string): { preferred?: Route; routes: Route[] } {
  const preferred = nearby.find((r) => r.code.toUpperCase() === preferredCode.toUpperCase());
  return { preferred, routes: [...nearby] };
}

/** Routes with a stop within walking distance of the commuter. Without a location, every route is kept. */
export function routesOnMyWay(routes: readonly Route[], me: LatLng | undefined, maxM = ON_MY_WAY_M): Route[] {
  if (!me) return [...routes];
  return routes.filter((route) =>
    DIRECTIONS.some((key) => stopsOf(route, key).some((stop) => distanceM(stop.coordinate, me) <= maxM)),
  );
}

/** One jeep on a route (route-units): coming to the commuter's stop (with minutes), or not heading there. */
export type RouteUnit = {
  driverId: string;
  plate: string;
  unitCode: string;
  /** Minutes to the boarding stop, when it is coming the commuter's way. */
  minutes?: number;
  coming: boolean;
  seatsFree?: number;
};

export type RouteEta = {
  /** Live jeeps on the route. */
  live: number;
  /** Jeeps heading to the boarding stop, before it. */
  approaching: number;
  /** Minutes until the nearest approaching jeep reaches the boarding stop. */
  minutes?: number;
  /** Vacant seats on the nearest approaching jeep, when its driver set the load recently. */
  seatsFree?: number;
  board?: { name: string; direction: DirectionKey; distance: number };
  /** The nearest approaching jeep (live-arrival-card: its plate and unit on the arrival card). */
  nextJeep?: { driverId: string; plate: string; unitCode: string; seats?: { free: number; capacity: number } };
  /** Every live jeep on the route (route-units): coming ones soonest first, then the others. */
  units?: RouteUnit[];
};

/**
 * Which lane a live jeep is on, and how far along it: the same rule the map's icon uses (`pickDirection`): by its GPS
 * heading while moving, else the closest lane. Straight stop lines (before the road is routed) cut corners, so a
 * jeep further off falls back to the closest line within ON_LINE_M.
 */
export function placeLiveJeep(
  paths: Record<DirectionKey, RoutePath>,
  jeep: LiveJeep,
  /** The commuter's direction: wins when a parked jeep is equally close to both lanes (the same road). */
  prefer?: DirectionKey,
): { key: DirectionKey; distance: number } | undefined {
  const moving = (jeep.speed ?? 0) >= 1 ? jeep.heading : undefined;
  const fit = pickDirection(paths, jeep.coordinate, moving, prefer);
  if (fit) return { key: fit.key, distance: fit.distance };
  const near = DIRECTIONS.filter((key) => paths[key].points.length > 1)
    .map((key) => ({ key, ...project(paths[key], jeep.coordinate) }))
    .filter((f) => f.offset <= ON_LINE_M)
    .sort((a, b) => a.offset - b.offset)[0];
  return near ? { key: near.key, distance: near.distance } : undefined;
}

/** A fix this close to the road is drawn on it (GPS is often 5–30 m off); further away, where the GPS put it. */
export const SNAP_TO_ROAD_M = 50;

/**
 * Where to draw a live jeep and which way it faces (light map matching). Near the route: on the road's centre line,
 * at the closest point of its lane, facing along the road. Far from it (a detour, bad GPS): exactly where the GPS put
 * it, facing its GPS heading. The lane comes from the jeep's own heading or position, never the commuter's direction,
 * so switching direction never moves a jeep.
 */
export function jeepPose(
  paths: Record<DirectionKey, RoutePath>,
  jeep: LiveJeep,
): { coordinate: LatLng; bearing: number; snapped: boolean } {
  const at = placeLiveJeep(paths, jeep);
  if (at) {
    const pose = poseAlong(paths[at.key], at.distance);
    if (distanceM(pose.coordinate, jeep.coordinate) <= SNAP_TO_ROAD_M) return { ...pose, snapped: true };
  }
  const moving = jeep.heading !== undefined && (jeep.speed ?? 0) >= 1;
  const bearing = moving || !at ? (jeep.heading ?? 0) : poseAlong(paths[at.key], at.distance).bearing;
  return { coordinate: jeep.coordinate, bearing, snapped: false };
}

/** Whether a live jeep is still coming to the commuter's boarding stop (the map draws it orange, else grey). */
export const jeepIncoming = (
  paths: Record<DirectionKey, RoutePath>,
  jeep: LiveJeep,
  boards: BoardingPoints,
  prefer?: DirectionKey,
) => {
  const at = placeLiveJeep(paths, jeep, prefer);
  return !!at && approachGap(paths, at, boards) !== undefined;
};

/**
 * waiting-pin lane: the direction whose road is closest to the pin (the side of the street the commuter waits on).
 * With a pin, only that lane is coloured and counted.
 */
export function nearestLane(paths: Record<DirectionKey, RoutePath>, p: LatLng): DirectionKey | undefined {
  return DIRECTIONS.filter((key) => paths[key].points.length > 1)
    .map((key) => ({ key, offset: project(paths[key], p).offset }))
    .sort((a, b) => a.offset - b.offset)[0]?.key;
}

/**
 * shared-street: both directions' roads this close to the pin means they run along the same street there (their
 * centre lines are only metres apart). Then only the picked direction counts and no extension is drawn.
 */
export const SHARED_STREET_M = 50;

/** Whether both directions run along the street at the pin (for every route: the same rule everywhere). */
export function onSharedStreet(paths: Record<DirectionKey, RoutePath>, pin: LatLng): boolean {
  return DIRECTIONS.every(
    (key) => paths[key].points.length > 1 && project(paths[key], pin).offset <= SHARED_STREET_M,
  );
}

/** A pin this close (road metres) to the end of its lane, where the other direction starts, is "near the end". */
export const NEAR_END_M = 2_000;

/**
 * The direction(s) a waiting pin counts: the lane nearest it, or both (undefined) when the pin is near the end of its
 * lane (within NEAR_END_M of the turnaround) and the other direction's road is within BOARD_ON_ROAD_M of it, so jeeps
 * starting the other direction stop there too. Far from the end, only the pin's lane.
 */
export function pinDirection(
  paths: Record<DirectionKey, RoutePath>,
  p: LatLng,
  /** The direction the commuter picked (direction-switch); the lane nearest the pin when not given. */
  lane?: DirectionKey,
): DirectionKey | undefined {
  // early-boarding: a pin on the road of the direction that turns into the picked one boards on that road.
  const near = lane ? (earlyBoardLane(paths, p, lane) ?? lane) : nearestLane(paths, p);
  if (!near) return undefined;
  // On a street both directions use: only the picked (or nearest) direction.
  if (onSharedStreet(paths, p)) return near;
  const other = otherWay(near);
  const otherClose = paths[other].points.length > 1 && project(paths[other], p).offset <= BOARD_ON_ROAD_M;
  const toEnd = paths[near].length - project(paths[near], p).distance;
  return otherClose && toEnd <= NEAR_END_M && turnsInto(paths, near, other) ? undefined : near;
}

/**
 * early-boarding: the commuter picked `picked`, but the pin is on the other direction's road (within BOARD_ON_ROAD_M,
 * and nearer it than their own road, on a street only that direction uses), and that direction turns into theirs. They board there, before the turnaround,
 * and ride round it (more vacant seats). Returns that other direction, else undefined.
 */
export function earlyBoardLane(
  paths: Record<DirectionKey, RoutePath>,
  pin: LatLng,
  picked: DirectionKey,
): DirectionKey | undefined {
  const other = otherWay(picked);
  if (paths[other].points.length < 2 || !turnsInto(paths, other, picked)) return undefined;
  // Only where the two directions run on different streets: on a shared one, the picked direction stops there anyway.
  if (onSharedStreet(paths, pin)) return undefined;
  const at = project(paths[other], pin);
  const onPicked = paths[picked].points.length > 1 ? project(paths[picked], pin).offset : Infinity;
  // A street only the other direction uses (one direction there): board early at any distance from the turnaround.
  // On a street both directions use (checked above), the picked direction stops there anyway.
  return at.offset <= BOARD_ON_ROAD_M && at.offset < onPicked ? other : undefined;
}

/**
 * turnaround-tail: with a waiting pin on (within BOARD_ON_ROAD_M of) the picked direction and within NEAR_END_M of its
 * start, the last NEAR_END_M of the direction that turns into it, drawn orange: jeeps finishing that direction turn
 * round and come to the pin. Undefined when the pin is further from the start (default colours), or the directions do
 * not join.
 */
export function turnaroundTail(
  paths: Record<DirectionKey, RoutePath>,
  pin: LatLng,
  lane: DirectionKey,
): { key: DirectionKey; from: number; to: number } | undefined {
  const prev = otherWay(lane);
  if (paths[lane].points.length < 2 || !turnsInto(paths, prev, lane)) return undefined;
  // On a street both directions use: the picked direction only (no extension).
  if (onSharedStreet(paths, pin)) return undefined;
  const at = project(paths[lane], pin);
  if (at.offset > BOARD_ON_ROAD_M || at.distance > NEAR_END_M) return undefined;
  const length = paths[prev].length;
  return { key: prev, from: Math.max(0, length - NEAR_END_M), to: length };
}

/**
 * The commuter's direction; or, with a waiting pin, "the lane nearest the pin" or "pin:<picked direction>", which also
 * counts the other direction near the end of the lane (`pinDirection`).
 */
export type DirectionChoice = DirectionKey | 'nearestLane' | `pin:${DirectionKey}`;

/** Whether direction `from` ends where `to` starts (the turnaround), so its jeeps carry on as `to`. */
export function turnsInto(paths: Record<DirectionKey, RoutePath>, from: DirectionKey, to: DirectionKey): boolean {
  const a = paths[from].points;
  const b = paths[to].points;
  return a.length > 1 && b.length > 1 && distanceM(a[a.length - 1], b[0]) <= TURN_JOIN_M;
}

/**
 * Road metres from a jeep to where the commuter boards, or undefined when it is not coming (turnaround-approach): on
 * the same direction before the boarding point, or near the end of the direction that turns into theirs, within
 * ACROSS_TURN_M. With both directions open (a waiting pin), a jeep that passed on one side still comes round to the
 * other side's boarding point. Also tells which direction's boarding point it comes to. The backend's ₱1 sharing uses the same rule.
 */
export function approachGap(
  paths: Record<DirectionKey, RoutePath>,
  at: { key: DirectionKey; distance: number },
  boards: BoardingPoints,
): { gap: number; key: DirectionKey } | undefined {
  const own = boards[at.key];
  if (own && at.distance <= own.along + AT_STOP_M) {
    const gap = Math.max(0, own.along - at.distance);
    // Too far to wait for: grey, like a jeep that passed.
    return gap <= MAX_WAIT_M ? { gap, key: at.key } : undefined;
  }
  const next = otherWay(at.key);
  const board = boards[next];
  if (!board || !turnsInto(paths, at.key, next)) return undefined;
  const gap = Math.max(0, paths[at.key].length - at.distance) + board.along;
  return gap <= ACROSS_TURN_M ? { gap, key: next } : undefined;
}

/**
 * The stretches of road that lead to the commuter's boarding point, drawn orange (turnaround-approach): each
 * boarding direction from its start up to the boarding point, and the joined end of the direction that turns into it.
 */
export function approachSegments(
  paths: Record<DirectionKey, RoutePath>,
  boards: BoardingPoints,
): { key: DirectionKey; from: number; to: number }[] {
  const out: { key: DirectionKey; from: number; to: number }[] = [];
  for (const key of DIRECTIONS) {
    const board = boards[key];
    if (!board || paths[key].points.length < 2) continue;
    // Only the stretch within MAX_WAIT_M: jeeps further back are too far to wait for.
    out.push({ key, from: Math.max(0, board.along - MAX_WAIT_M), to: Math.min(paths[key].length, board.along) });
    const prev = otherWay(key);
    if (board.along < ACROSS_TURN_M && turnsInto(paths, prev, key)) {
      const length = paths[prev].length;
      out.push({ key: prev, from: Math.max(0, length - (ACROSS_TURN_M - board.along)), to: length });
    }
  }
  return out;
}

/**
 * Live jeeps, approaching jeeps and the ETA of the nearest one to the commuter's boarding stop. Each direction is
 * checked at its own stop closest to the commuter (within walking distance); the sooner arrival wins, since the app
 * does not know where the commuter is heading. Distances follow the stops in order at an average jeepney speed, so
 * the ETA is an estimate.
 */
/**
 * How far along each direction's path the commuter boards: where they stand when they are within BOARD_ON_ROAD_M of
 * the road, else that direction's stop closest to them (any distance).
 */
export type BoardingPoints = Partial<Record<DirectionKey, { along: number; name: string; distance: number }>>;

export function boardingPoints(
  named: Record<DirectionKey, readonly { name: string; coordinate: LatLng }[]>,
  paths: Record<DirectionKey, RoutePath>,
  me: LatLng | undefined,
  /** Only the commuter's direction of travel; both when not given. */
  direction?: DirectionKey,
): BoardingPoints {
  const out: BoardingPoints = {};
  if (!me) return out;
  for (const key of direction ? [direction] : DIRECTIONS) {
    const stop = nearestStop({ [key]: named[key] } as Record<DirectionKey, (typeof named)[DirectionKey]>, me);
    // No walking limit: the routes come from the backend's geofence, which falls back to the nearest routes when none
    // passes close, and the ₱1 view counts incoming jeepneys to the nearest stop however far it is.
    if (!stop || paths[key].points.length < 2) continue;
    // On the road: board right here (jeepneys pick up along the road), the same rule as the backend's ₱1 sharing.
    const here = project(paths[key], me);
    const along = here.offset <= BOARD_ON_ROAD_M ? here.distance : project(paths[key], stop.coordinate).distance;
    // The name stays the nearest stop's (shown to the commuter); only the point on the road moves.
    out[key] = { along, name: stop.name, distance: stop.distance };
  }
  return out;
}

/** Where the map tells the commuter to board: on the road where they stand, or at the nearest stop. */
export type Pickup = {
  /** True when they board right where they are (within BOARD_ON_ROAD_M of the road). */
  onRoad: boolean;
  /** The nearest stop's name (also shown when boarding on the road, for reference). */
  name: string;
  /** The point to highlight: on the road, or the stop. */
  coordinate: LatLng;
  /** Metres to walk: to the road, or to the stop. */
  distance: number;
  walkMinutes: number;
};

/**
 * The boarding point on the commuter's direction of travel, by the same rule as `boardingPoints` and the backend's
 * ₱1 sharing: on the road when they are within BOARD_ON_ROAD_M of it, else the nearest stop.
 */
export function pickupPoint(
  stops: readonly { name: string; coordinate: LatLng }[],
  path: RoutePath | undefined,
  me: LatLng,
): Pickup | undefined {
  const stop = nearestStop({ only: stops }, me);
  if (!stop) return undefined;
  if (path && path.points.length > 1) {
    const here = project(path, me);
    if (here.offset <= BOARD_ON_ROAD_M) {
      return {
        onRoad: true,
        name: stop.name,
        coordinate: poseAlong(path, here.distance).coordinate,
        distance: here.offset,
        walkMinutes: Math.max(1, Math.round(here.offset / WALK_M_PER_MIN)),
      };
    }
  }
  return {
    onRoad: false,
    name: stop.name,
    coordinate: stop.coordinate,
    distance: stop.distance,
    walkMinutes: stop.walkMinutes,
  };
}

/** The callout text for a pickup point. */
export function pickupText(pickup: Pickup, directionLabel?: string): { title: string; detail: string } {
  const way = directionLabel ? ` • ${directionLabel}` : '';
  if (!pickup.onRoad) {
    return {
      title: `Board at ${pickup.name}`,
      detail: `${distanceText(pickup.distance)} • ${pickup.walkMinutes} min walk${way}`,
    };
  }
  return {
    title: 'Board here, on the route',
    detail: pickup.distance < 30 ? `You're on the road${way}` : `${distanceText(pickup.distance)} to the road${way}`,
  };
}

/**
 * Whether a jeep at `along` metres on `direction` is still coming to the commuter's boarding stop (or just at it).
 * A jeep that passed the stop, or runs a direction with no stop near the commuter, is not.
 */
export function isIncoming(direction: DirectionKey | undefined, along: number, boards: BoardingPoints): boolean {
  const board = direction ? boards[direction] : undefined;
  return !!board && along <= board.along + AT_STOP_M;
}

export function routeEta(
  route: Route,
  jeeps: readonly LiveJeep[],
  me: LatLng | undefined,
  roadPaths?: Record<DirectionKey, RoutePath>,
  /** The commuter's direction of travel: only jeeps going that way count. Both ways when not given. */
  choice?: DirectionChoice,
): RouteEta {
  const named = { outbound: stopsOf(route, 'outbound'), inbound: stopsOf(route, 'inbound') };
  const nearest = me ? nearestStop(named, me) : undefined;
  if (!me || !nearest) return { live: jeeps.length, approaching: 0 };

  // Along the road when it is known; straight lines between stops until then (they cut corners).
  const paths = roadPaths ?? {
    outbound: buildPath(named.outbound.map((s) => s.coordinate)),
    inbound: buildPath(named.inbound.map((s) => s.coordinate)),
  };
  const direction =
    choice === 'nearestLane'
      ? pinDirection(paths, me)
      : choice?.startsWith('pin:')
        ? pinDirection(paths, me, choice.slice(4) as DirectionKey)
        : (choice as DirectionKey | undefined);
  const boards = boardingPoints(named, paths, me, direction);

  // Each jeep on one lane only, the same rule as the map's icon colour (`placeLiveJeep`).
  let approaching = 0;
  const units: RouteUnit[] = [];
  // Exact metres to the stop, so the list's order (and its tracked first row) matches `nextJeep`, not rounded minutes.
  const gaps = new Map<string, number>();
  let best:
    | { gap: number; board: NonNullable<RouteEta['board']>; seats?: number; jeep: NonNullable<RouteEta['nextJeep']> }
    | undefined;
  for (const jeep of jeeps) {
    // Not nudged towards the commuter's direction: switching direction never moves a jeep to the other lane.
    const at = placeLiveJeep(paths, jeep);
    const unit = { driverId: jeep.driverId, plate: jeep.plate, unitCode: jeep.unitCode, seatsFree: jeep.seats?.free };
    // Coming on the same direction, or across the turnaround (turnaround-approach).
    const approach = at ? approachGap(paths, at, boards) : undefined;
    if (!approach) {
      units.push({ ...unit, coming: false });
      continue;
    }
    const b = boards[approach.key] as NonNullable<BoardingPoints[DirectionKey]>;
    const { gap } = approach;
    approaching += 1;
    gaps.set(jeep.driverId, gap);
    units.push({ ...unit, coming: true, minutes: Math.max(1, Math.round(gap / JEEP_M_PER_MIN)) });
    if (!best || gap < best.gap)
      best = {
        gap,
        board: { name: b.name, direction: approach.key, distance: b.distance },
        seats: jeep.seats?.free,
        jeep: { driverId: jeep.driverId, plate: jeep.plate, unitCode: jeep.unitCode, seats: jeep.seats },
      };
  }
  return {
    live: jeeps.length,
    approaching,
    minutes: best ? Math.max(1, Math.round(best.gap / JEEP_M_PER_MIN)) : undefined,
    seatsFree: best?.seats,
    nextJeep: best?.jeep,
    units: units.sort(
      (a, b) =>
        Number(b.coming) - Number(a.coming) ||
        (gaps.get(a.driverId) ?? Infinity) - (gaps.get(b.driverId) ?? Infinity),
    ),
    board: best?.board ?? { name: nearest.name, direction: nearest.direction, distance: nearest.distance },
  };
}

export type DirectionOnRoad = { direction: DirectionKey; label: string; count: number };

/**
 * Live jeeps on the road per direction. A moving jeep counts in the direction its heading matches; a parked one (or
 * one without a heading) in the direction whose lane it is closest to. Jeeps far from both lanes are not counted.
 */
export function onRoadByDirection(
  route: Route,
  jeeps: readonly LiveJeep[],
  roadPaths?: Record<DirectionKey, RoutePath>,
): DirectionOnRoad[] {
  const paths = roadPaths ?? {
    outbound: buildPath(stopsOf(route, 'outbound').map((s) => s.coordinate)),
    inbound: buildPath(stopsOf(route, 'inbound').map((s) => s.coordinate)),
  };
  const counts: Record<DirectionKey, number> = { outbound: 0, inbound: 0 };
  for (const jeep of jeeps) {
    const at = placeLiveJeep(paths, jeep);
    if (at) counts[at.key] += 1;
  }
  return DIRECTIONS.map((direction) => ({
    direction,
    label: route.directions[direction]?.label ?? direction,
    count: counts[direction],
  }));
}

export type CommuteOption = RouteOption & {
  routeId: string;
  route: Route;
  eta: string;
  minutes?: number;
  /** Where to board (the nearest stop's name), and the nearest approaching jeep (live-arrival-card). */
  boardName?: string;
  /** How far the commuter is from where they board (metres). */
  boardDistance?: number;
  nextJeep?: RouteEta['nextJeep'];
  /** Every live jeep on the route (route-units), for the list under its card. */
  units?: RouteUnit[];
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "4 seats free", "1 seat free" or "Full", for a jeep's vacant seats. */
export const seatsText = (free: number) => (free <= 0 ? 'Full' : `${plural(free, 'seat')} free`);

function subtitleOf(eta: RouteEta): string {
  if (eta.approaching > 0) {
    // The nearest approaching jeep's vacant seats, when its driver keeps the load up to date.
    const seats = eta.seatsFree === undefined ? '' : ` • ${seatsText(eta.seatsFree)}`;
    return `${plural(eta.approaching, 'vehicle')} approaching${seats}`;
  }
  if (eta.live > 0) return `${plural(eta.live, 'jeep')} live, none heading to your stop yet`;
  return 'No live jeeps yet';
}

/**
 * The Live Map's route list: the preferred route and the other routes on the commuter's way, soonest first.
 * Badges: the preferred route is "YOUR PREFERRED ROUTE"; the soonest other route with a live ETA that beats the
 * preferred one is "BEST OPTION"; the rest are "ALTERNATIVE".
 */
export function buildCommuteOptions(
  preferred: Route | null | undefined,
  others: readonly Route[],
  jeepsByRoute: Record<string, LiveJeep[]>,
  me: LatLng | undefined,
  pathsByRoute: Record<string, Record<DirectionKey, RoutePath> | undefined> = {},
  direction?: DirectionChoice,
  /** The routes nearest first (`routesNearby`): when given, the list keeps this order instead of soonest ETA. */
  nearestFirst?: readonly Route[],
): CommuteOption[] {
  // The geofence list (`nearestFirst`) is already the routes near the commuter, measured to each route's line: do not
  // filter it again by stops here (that dropped routes like 17C whose line passes close but whose stops are far).
  const nearby = nearestFirst ? [...others] : routesOnMyWay(others, me);
  const rows = [...(preferred ? [preferred] : []), ...nearby].map((route) => ({
    route,
    eta: routeEta(route, jeepsByRoute[route.id] ?? [], me, pathsByRoute[route.id], direction),
    isPreferred: route.id === preferred?.id,
  }));
  const rank = nearestFirst ? new Map(nearestFirst.map((r, i) => [r.id, i])) : undefined;
  rows.sort((a, b) => {
    if (rank) return (rank.get(a.route.id) ?? Infinity) - (rank.get(b.route.id) ?? Infinity);
    const am = a.eta.minutes ?? Infinity;
    const bm = b.eta.minutes ?? Infinity;
    if (am !== bm) return am - bm;
    if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1;
    return a.route.code.localeCompare(b.route.code);
  });

  const preferredMinutes = rows.find((r) => r.isPreferred)?.eta.minutes ?? Infinity;
  const best = rows.find((r) => !r.isPreferred && r.eta.minutes !== undefined && r.eta.minutes < preferredMinutes);

  return rows.map(({ route, eta, isPreferred }) => {
    const tone = isPreferred ? 'preferred' : route === best?.route ? 'best' : 'alternative';
    return {
      routeId: route.id,
      route,
      code: route.code,
      name: `Route ${route.code}`,
      badge: tone === 'preferred' ? 'YOUR PREFERRED ROUTE' : tone === 'best' ? 'BEST OPTION' : 'ALTERNATIVE',
      tone,
      subtitle: subtitleOf(eta),
      eta: eta.minutes === undefined ? '—' : `${eta.minutes} min`,
      etaCaption: eta.minutes === undefined ? 'NO ETA' : 'ETA',
      minutes: eta.minutes,
      boardName: eta.board?.name,
      boardDistance: eta.board?.distance,
      nextJeep: eta.nextJeep,
      units: eta.units,
    };
  });
}
