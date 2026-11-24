import type { LatLng } from 'react-native-maps';

import { bearingBetween } from './jeepMotion';

/**
 * An open route path (one direction, first stop to last) measured in metres, for placing live jeeps on the road:
 * a GPS fix is projected onto the path, and the marker glides along the path between fixes instead of cutting
 * corners.
 */
export type RoutePath = { points: LatLng[]; cumulative: number[]; length: number };

const M_PER_DEG = 111_320;

/** Flat-earth offset in metres from `a` to `b` (east, north); accurate over a city. */
function metres(a: LatLng, b: LatLng): { x: number; y: number } {
  const cos = Math.cos((((a.latitude + b.latitude) / 2) * Math.PI) / 180);
  return { x: (b.longitude - a.longitude) * M_PER_DEG * cos, y: (b.latitude - a.latitude) * M_PER_DEG };
}

export const distanceM = (a: LatLng, b: LatLng) => {
  const { x, y } = metres(a, b);
  return Math.hypot(x, y);
};

export function buildPath(points: readonly LatLng[]): RoutePath {
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1] + distanceM(points[i - 1], points[i]));
  return { points: [...points], cumulative, length: cumulative[cumulative.length - 1] ?? 0 };
}

/** Where `distance` metres along the path is, and the road's bearing there (looking ~15 m ahead). */
export function poseAlong(path: RoutePath, distance: number): { coordinate: LatLng; bearing: number } {
  const at = pointAt(path, distance);
  const ahead = pointAt(path, Math.min(path.length, distance + 15));
  const behind = pointAt(path, Math.max(0, distance - 15));
  const [from, to] = distance + 15 <= path.length ? [at, ahead] : [behind, at];
  return { coordinate: at, bearing: bearingBetween(from, to) };
}

function pointAt(path: RoutePath, distance: number): LatLng {
  const { points, cumulative } = path;
  if (points.length === 0) return { latitude: 0, longitude: 0 };
  const d = Math.max(0, Math.min(path.length, distance));
  let i = 1;
  while (i < points.length - 1 && cumulative[i] < d) i++;
  const span = cumulative[i] - cumulative[i - 1];
  const t = span > 0 ? (d - cumulative[i - 1]) / span : 0;
  const a = points[i - 1];
  const b = points[i] ?? a;
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

/** The nearest point of the path to `p`: how far along the path it is, and how far `p` is from the road. */
export function project(path: RoutePath, p: LatLng): { distance: number; offset: number; bearing: number } {
  let best = { distance: 0, offset: Infinity, bearing: 0 };
  for (let i = 1; i < path.points.length; i++) {
    const a = path.points[i - 1];
    const b = path.points[i];
    const ab = metres(a, b);
    const ap = metres(a, p);
    const len2 = ab.x * ab.x + ab.y * ab.y;
    const t = len2 > 0 ? Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y) / len2)) : 0;
    const offset = Math.hypot(ap.x - ab.x * t, ap.y - ab.y * t);
    if (offset < best.offset) {
      best = { distance: path.cumulative[i - 1] + Math.sqrt(len2) * t, offset, bearing: bearingBetween(a, b) };
    }
  }
  return best;
}

/** Smallest angle between two compass bearings, 0 to 180. */
export const angleBetween = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

/** A fix further than this from the road is shown where it is, not snapped. */
export const SNAP_MAX_M = 80;

/**
 * Which direction's path a jeep is on. Both directions often share a road, so the GPS heading decides when the
 * jeep is moving; otherwise the nearer path, or the previous direction when they are equally near.
 */
export function pickDirection<K extends string>(
  paths: Record<K, RoutePath>,
  p: LatLng,
  heading: number | undefined,
  previous: K | undefined,
): { key: K; distance: number; offset: number; bearing: number } | undefined {
  const fits = (Object.keys(paths) as K[])
    .filter((key) => paths[key].points.length > 1)
    .map((key) => ({ key, ...project(paths[key], p) }))
    .filter((f) => f.offset <= SNAP_MAX_M);
  if (fits.length === 0) return undefined;
  if (heading !== undefined) {
    const aligned = fits.filter((f) => angleBetween(f.bearing, heading) <= 60);
    if (aligned.length > 0) return aligned.sort((a, b) => a.offset - b.offset)[0];
  }
  const sorted = fits.sort((a, b) => a.offset - b.offset);
  const sameRoad = sorted.filter((f) => f.offset - sorted[0].offset < 15);
  return sameRoad.find((f) => f.key === previous) ?? sorted[0];
}

/** Fixes further than this from every direction's road are not on this corridor (bad GPS, emulator default). */
export const OFF_CORRIDOR_M = 1_000;

/** True when `p` is within `maxM` metres of any of the paths. */
export function nearCorridor(paths: Record<string, RoutePath>, p: LatLng, maxM = OFF_CORRIDOR_M): boolean {
  return Object.values(paths).some((path) => path.points.length > 1 && project(path, p).offset <= maxM);
}

/** `p` moved `metres` to the right of `bearing` (compass degrees): the lane on the right-hand side of the road. */
export function shiftRight(p: LatLng, bearing: number, metres: number): LatLng {
  if (!metres) return p;
  const right = ((bearing + 90) * Math.PI) / 180;
  const cos = Math.cos((p.latitude * Math.PI) / 180) || 1;
  return {
    latitude: p.latitude + (Math.cos(right) * metres) / M_PER_DEG,
    longitude: p.longitude + (Math.sin(right) * metres) / (M_PER_DEG * cos),
  };
}

/**
 * The path moved `metres` to the right of its direction of travel (Philippine traffic keeps right), so the two
 * directions of a route that share a road are drawn side by side. Each point moves along the average of its two
 * neighbouring segments' directions, which keeps corners joined.
 */
export function offsetRight(points: readonly LatLng[], metres: number): LatLng[] {
  if (!metres || points.length < 2) return [...points];
  // Road direction over a stretch about as long as the offset (at least 20 m) on each side, so dense road
  // geometry does not make the shifted line wobble.
  const span = Math.max(20, metres);
  return points.map((p, i) => {
    let a = i;
    while (a > 0 && distanceM(points[a], p) < span) a--;
    let b = i;
    while (b < points.length - 1 && distanceM(points[b], p) < span) b++;
    return shiftRight(p, bearingBetween(points[a], points[b]), metres);
  });
}

/** Average walking pace, metres per minute (about 4.8 km/h). */
export const WALK_M_PER_MIN = 80;

/** A stop to board at: the nearest one to the commuter, of either direction. */
export type NearestStop<K extends string> = {
  direction: K;
  name: string;
  coordinate: LatLng;
  /** Straight-line metres from the commuter. */
  distance: number;
  walkMinutes: number;
};

/** The stop nearest to `me` among every direction's stops, or undefined when there are none. */
export function nearestStop<K extends string>(
  stops: Record<K, readonly { name: string; coordinate: LatLng }[]>,
  me: LatLng,
): NearestStop<K> | undefined {
  let best: NearestStop<K> | undefined;
  for (const direction of Object.keys(stops) as K[]) {
    for (const stop of stops[direction]) {
      const distance = distanceM(me, stop.coordinate);
      if (!best || distance < best.distance) {
        best = { direction, name: stop.name, coordinate: stop.coordinate, distance, walkMinutes: 0 };
      }
    }
  }
  if (best) best.walkMinutes = Math.max(1, Math.round(best.distance / WALK_M_PER_MIN));
  return best;
}

/** "350 m" or "1.2 km". */
export const formatDistance = (metres: number) =>
  metres < 1000 ? `${Math.round(metres / 10) * 10} m` : `${(metres / 1000).toFixed(1)} km`;

/**
 * Decodes a Google encoded polyline (precision 5), e.g. a route's `roadPaths` from the Routes API.
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(i++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && i < encoded.length);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (i < encoded.length) {
    lat += next();
    lng += next();
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

/** The points of a path between two distances along it (empty when `to <= from`). */
export function slicePath(path: RoutePath, from: number, to: number): LatLng[] {
  const start = Math.max(0, from);
  const end = Math.min(path.length, to);
  if (end <= start || path.points.length < 2) return [];
  const out = [poseAlong(path, start).coordinate];
  path.points.forEach((p, i) => {
    if (path.cumulative[i] > start && path.cumulative[i] < end) out.push(p);
  });
  out.push(poseAlong(path, end).coordinate);
  return out;
}
