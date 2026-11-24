import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { LatLng } from 'react-native-maps';

import { useCommuteRoutes, useNearbyRoutes, type DirectionKey, type Route } from '@packages/tanstack/query/routes';

import { orderNearby } from './commuteOptions';
import type { RoutePath } from './livePath';
import { roadPathQuery, useRouteJeeps, type LiveJeep } from './useLiveCorridor';

export type RoutesOnMyWay = {
  /** The preferred route, when it is active. */
  preferred?: Route;
  /** The preferred route first, then the other routes with a stop near the commuter (all while location is unknown). */
  routes: Route[];
  jeepsByRoute: Record<string, LiveJeep[]>;
  /** Road paths per route, once routed (shared with the map). */
  pathsByRoute: Record<string, Record<DirectionKey, RoutePath> | undefined>;
  loading: boolean;
  error?: Error | null;
  /** No route passes near the commuter: the nearest one shown anyway, and how far its line is (metres). */
  farthest?: { code: string; distanceM: number };
};

/**
 * The routes near the commuter (`routesNearby`, by a geofence around them) or, without their location, the preferred
 * route and the routes on its corridor (`routesForCommute`), with each route's live jeeps and
 * road path. Used by the Commute hub and the Live Map; the commuter's location is only used here, on the phone.
 */
export function useRoutesOnMyWay(preferredCode: string, me: LatLng | undefined): RoutesOnMyWay {
  // With the commuter's location: the routes inside the geofence around them (Revision 16). Without it: the preferred
  // route and the routes sharing its corridor.
  const nearby = useNearbyRoutes(me);
  const commute = useCommuteRoutes(me ? undefined : preferredCode);
  const others = commute.data?.others;
  const fromCommute = commute.data?.preferred ?? undefined;
  const { preferred, routes } = useMemo(() => {
    if (me) return orderNearby(nearby.data ?? [], preferredCode);
    return {
      preferred: fromCommute,
      routes: [
        ...(fromCommute ? [fromCommute] : []),
        ...[...(others ?? [])].sort((a, b) => a.code.localeCompare(b.code)),
      ],
    };
  }, [me, nearby.data, preferredCode, fromCommute, others]);
  const source = me ? nearby : commute;
  const routeIds = useMemo(() => routes.map((r) => r.id), [routes]);
  const jeepsByRoute = useRouteJeeps(routeIds);

  const roads = useQueries({ queries: routes.map((route) => roadPathQuery(route)) });
  const roadsKey = roads.map((r) => r.dataUpdatedAt).join(',');
  const pathsByRoute = useMemo(
    () => Object.fromEntries(routes.map((route, i) => [route.id, roads[i]?.data])),
    // roads is a new array every render; its data changes only when a query updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routes, roadsKey],
  );

  // The backend fell back to the nearest routes (none inside its geofence): say how far the nearest one is.
  const first = me ? nearby.data?.[0] : undefined;
  const farthest = first && first.withinRadius === false ? { code: first.code, distanceM: first.distanceM } : undefined;

  return { preferred, routes, jeepsByRoute, pathsByRoute, loading: source.isLoading, error: source.error, farthest };
}
