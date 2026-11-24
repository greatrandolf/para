import type { LatLng, Region } from 'react-native-maps';

import type { TravelDirection } from '@/types/commuter';

import { ROUTE_ROAD } from './corridorGeometry';

/**
 * Route 17B corridor for the live map: road geometry is hardcoded (see corridorGeometry.ts),
 * and the two lanes are offset from it. Coordinates come from OpenStreetMap; verify before release.
 */

/** Pickup point on N. Escario Street at Kamputhaw (matches `trip.pickup`). Sits on the route. */
export const PICKUP: LatLng = { latitude: 10.316898, longitude: 123.892774 };

/** Lane distance from the road centre line, in metres (each lane keeps to the right of its direction). */
const LANE_OFFSET_M = 8;

const METRES_PER_DEG_LAT = 111320;

/** Shifts every point to the right of its direction of travel (Philippine traffic keeps to the right). */
function offsetRight(points: LatLng[], metres: number): LatLng[] {
  return points.map((p, i) => {
    const before = points[Math.max(0, i - 1)];
    const after = points[Math.min(points.length - 1, i + 1)];
    const cos = Math.cos((p.latitude * Math.PI) / 180);
    const east = (after.longitude - before.longitude) * cos;
    const north = after.latitude - before.latitude;
    const length = Math.hypot(east, north) || 1;
    // The right-hand side of a heading (east, north) is (north, -east).
    const rightEast = north / length;
    const rightNorth = -east / length;
    return {
      latitude: p.latitude + (rightNorth * metres) / METRES_PER_DEG_LAT,
      longitude: p.longitude + (rightEast * metres) / (METRES_PER_DEG_LAT * cos),
    };
  });
}

/** Lane drawn for each direction. The two lanes run the same road in opposite directions. */
export const ROUTE_LANES: Record<TravelDirection, LatLng[]> = {
  colon: offsetRight(ROUTE_ROAD, LANE_OFFSET_M), // IT Park -> P. Lopez (towards Colon)
  apas: offsetRight([...ROUTE_ROAD].reverse(), LANE_OFFSET_M), // P. Lopez -> IT Park (towards Apas)
};

/** Jeep start positions by unit id (names and ETAs come from `trip.directions`). */
export const JEEPS: Record<string, { direction: TravelDirection; start: number }> = {
  u14: { direction: 'apas', start: 0.18 },
  u08: { direction: 'apas', start: 0.62 },
  u23: { direction: 'colon', start: 0.4 },
  u11: { direction: 'colon', start: 0.74 },
  u05: { direction: 'apas', start: 0.05 },
  u19: { direction: 'apas', start: 0.45 },
  u26: { direction: 'apas', start: 0.9 },
  u31: { direction: 'colon', start: 0.12 },
  u37: { direction: 'colon', start: 0.56 },
  u42: { direction: 'colon', start: 0.9 },
};

/** Region that frames the whole road on first load. */
const lats = ROUTE_ROAD.map((p) => p.latitude);
const lons = ROUTE_ROAD.map((p) => p.longitude);
const minLat = Math.min(...lats);
const maxLat = Math.max(...lats);
const minLon = Math.min(...lons);
const maxLon = Math.max(...lons);

export const CORRIDOR_REGION: Region = {
  latitude: (minLat + maxLat) / 2,
  longitude: (minLon + maxLon) / 2,
  latitudeDelta: (maxLat - minLat) * 1.4,
  longitudeDelta: (maxLon - minLon) * 1.4,
};
