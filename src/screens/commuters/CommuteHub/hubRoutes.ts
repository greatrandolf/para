import type { RouteFilterOption, TransitRoute } from '@/types/commuter';
import type { DirectionKey, Route } from '@packages/tanstack/query/routes';

import { onRoadByDirection } from '@/screens/commuters/LiveTracking/commuteOptions';
import type { RoutePath } from '@/screens/commuters/LiveTracking/livePath';
import type { LiveJeep } from '@/screens/commuters/LiveTracking/useLiveCorridor';

/** ₱ per live view while jeeps are on the road (free when none is). */
const TRACK_PASS_FARE = 1;

/** "14.8 km", "9 km". */
const km = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)} km`;

/** Round-trip length from the portal, else the road between the stops (once routed), else unknown. */
function distanceOf(route: Route, paths?: Record<DirectionKey, RoutePath>): string {
  if (route.roundtripKm && route.roundtripKm > 0) return km(route.roundtripKm);
  if (!paths) return '';
  const metres = paths.outbound.length + paths.inbound.length;
  return metres > 0 ? km(Math.round(metres / 100) / 10) : '';
}

/** Distinct stops over both directions (a stop served both ways counts once). */
const stopCount = (route: Route) =>
  new Set(
    (['outbound', 'inbound'] as const).flatMap((key) => (route.directions[key]?.waypoints ?? []).map((w) => w.name)),
  ).size;

/**
 * A backend route as a Commute hub card: its live jeeps on the road per direction, and nothing about arrival
 * times. All routes are jeepney routes for now (routes have no vehicle type yet).
 */
export function toTransitRoute(
  route: Route,
  jeeps: readonly LiveJeep[],
  paths?: Record<DirectionKey, RoutePath>,
): TransitRoute {
  const directionsOnRoad = onRoadByDirection(route, jeeps, paths).map(({ label, count }) => ({ label, count }));
  const onRoad = directionsOnRoad.reduce((sum, d) => sum + d.count, 0);
  return {
    id: route.id,
    code: route.code,
    name: route.name,
    vehicleType: 'jeepney',
    vehicleStyle: 'mixedJeepney',
    vehicleLabel: 'Jeepney',
    vehicleIcon: 'airport-shuttle',
    vehiclesOnRoad: onRoad,
    via: route.directions.outbound?.via || route.directions.outbound?.label || '',
    distance: distanceOf(route, paths),
    stops: stopCount(route),
    baseFare: route.baseFare ?? 0,
    trackPassFare: onRoad > 0 ? TRACK_PASS_FARE : 0,
    status: onRoad > 0 ? 'active' : 'offline',
    directionsOnRoad,
  };
}

/**
 * Filter chips counted by live vehicles on the road over the listed routes (not by routes): "All Transit (1)" when one
 * jeepney is live across three routes. A vehicle is live on one route only, so none is counted twice.
 */
export function hubFilterOptions(routes: readonly TransitRoute[]): RouteFilterOption[] {
  const live = (type?: TransitRoute['vehicleType']) =>
    routes.filter((r) => !type || r.vehicleType === type).reduce((sum, r) => sum + r.vehiclesOnRoad, 0);
  const jeepneys = live('jeepney');
  const buses = live('bus');
  return [
    { value: 'all', label: `All Transit (${live()})`, icon: 'alt-route' },
    { value: 'jeepney', label: `Jeepneys Only (${jeepneys})`, icon: 'airport-shuttle' },
    { value: 'bus', label: `Buses Only (${buses})`, icon: 'directions-bus' },
  ];
}
