import type { LatLng } from 'react-native-maps';

import type { TravelDirection } from '@/types/commuter';

import { ROUTE_LANES } from './corridorRoute';

/** Time for one jeep to run the full circuit (about 19 km, roughly 28 km/h). */
export const JEEP_LOOP_MS = 40 * 60 * 1000;

/** Route pose: where the jeep is and the compass bearing it is heading (0 = north, clockwise). */
export type JeepPose = { coordinate: LatLng; bearing: number };

type Loop = { points: LatLng[]; cumulative: number[]; total: number };

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Equirectangular distance in degrees; accurate enough for a few km of corridor. */
function planarDistance(a: LatLng, b: LatLng): number {
  const dLat = b.latitude - a.latitude;
  const dLon = (b.longitude - a.longitude) * Math.cos(toRad((a.latitude + b.latitude) / 2));
  return Math.hypot(dLat, dLon);
}

/** Initial great-circle bearing from `a` to `b`, in degrees clockwise from north. */
export function bearingBetween(a: LatLng, b: LatLng): number {
  const phi1 = toRad(a.latitude);
  const phi2 = toRad(b.latitude);
  const dLambda = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Closed loop through `points`; the last point connects back to the first. */
export function buildLoop(points: LatLng[]): Loop {
  const cumulative = [0];
  for (let i = 0; i < points.length; i++) {
    cumulative.push(cumulative[i] + planarDistance(points[i], points[(i + 1) % points.length]));
  }
  return { points, cumulative, total: cumulative[points.length] };
}

/** How far ahead the heading is read, about 20 m: the vehicle starts turning before the corner, as a driver steers. */
const LOOKAHEAD_DEG = 0.00018;

/** Point on the loop after `fraction` of its length (any number; wraps around). */
function coordinateAt(loop: Loop, fraction: number): LatLng {
  const f = ((fraction % 1) + 1) % 1;
  const distance = f * loop.total;
  const n = loop.points.length;

  let i = 0;
  while (i < n - 1 && loop.cumulative[i + 1] <= distance) i++;

  const from = loop.points[i];
  const to = loop.points[(i + 1) % n];
  const segment = loop.cumulative[i + 1] - loop.cumulative[i];
  const t = segment > 0 ? (distance - loop.cumulative[i]) / segment : 0;

  return {
    latitude: from.latitude + (to.latitude - from.latitude) * t,
    longitude: from.longitude + (to.longitude - from.longitude) * t,
  };
}

/**
 * Position and heading after `fraction` of the loop. The heading points at a spot about
 * 20 m ahead, so it swings through a corner instead of snapping at the lane's bend points.
 */
export function poseAt(loop: Loop, fraction: number): JeepPose {
  const coordinate = coordinateAt(loop, fraction);
  const ahead = coordinateAt(loop, fraction + LOOKAHEAD_DEG / loop.total);
  return { coordinate, bearing: bearingBetween(coordinate, ahead) };
}

/**
 * Turn `current` towards `target` by at most `maxStep` degrees, the short way round.
 * Limits how fast the vehicle can swing, so turns look like a real vehicle's steering.
 */
export function turnTowards(current: number, target: number, maxStep: number): number {
  const delta = ((target - current + 540) % 360) - 180;
  const step = Math.max(-maxStep, Math.min(maxStep, delta));
  return (current + step + 360) % 360;
}

/** One circuit: the Colon lane (IT Park to Carbon), then the Apas lane back. Every jeep runs this loop. */
export const CIRCUIT: Loop = buildLoop([...ROUTE_LANES.colon, ...ROUTE_LANES.apas]);

/** Share of the circuit's length taken by the Colon lane. */
const COLON_SHARE = CIRCUIT.cumulative[ROUTE_LANES.colon.length - 1] / CIRCUIT.total;

/** True while a jeep at this circuit fraction is on the Colon lane (heading to Colon), false on the Apas lane. */
export function towardsColonAt(fraction: number): boolean {
  const f = ((fraction % 1) + 1) % 1;
  return f < COLON_SHARE;
}

/** Maps a position along a direction's own lane (0..1) to a fraction of the circuit. */
export function circuitFraction(direction: TravelDirection, laneFraction: number): number {
  return direction === 'colon' ? laneFraction * COLON_SHARE : COLON_SHARE + laneFraction * (1 - COLON_SHARE);
}
