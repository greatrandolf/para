import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useFunctionsClient } from '../QueryProvider';
import { routesApi } from './api';
import { routeKeys } from './keys';

const useRoutesApi = () => {
  const client = useFunctionsClient();
  return useMemo(() => routesApi(client), [client]);
};

/** Routes change rarely (the portal edits them): keep them for five minutes. */
const ROUTE_STALE_MS = 5 * 60 * 1000;

/** Every active route. */
export function useRoutes(enabled = true) {
  const api = useRoutesApi();
  return useQuery({
    queryKey: routeKeys.list(),
    queryFn: ({ signal }) => api.list(signal).then((r) => r.routes),
    enabled,
    staleTime: ROUTE_STALE_MS,
  });
}

/** One route with its stops, per direction. */
export function useRoute(routeId: string | undefined) {
  const api = useRoutesApi();
  return useQuery({
    queryKey: routeKeys.detail(routeId ?? ''),
    queryFn: ({ signal }) => api.get(routeId as string, signal).then((r) => r.route),
    enabled: !!routeId,
    staleTime: ROUTE_STALE_MS,
  });
}

/** The commuter's preferred route and the routes on their way (see `routesForCommute`). */
export function useCommuteRoutes(preferredCode: string | undefined) {
  const api = useRoutesApi();
  return useQuery({
    queryKey: routeKeys.commute(preferredCode ?? ''),
    queryFn: ({ signal }) => api.forCommute(preferredCode as string, signal),
    enabled: !!preferredCode,
    staleTime: ROUTE_STALE_MS,
  });
}

/** Rounds a coordinate to 3 decimals (~110 m): enough to find nearby routes, and the exact position stays on the phone. */
export const roundCoordinate = (value: number) => Math.round(value * 1000) / 1000;

/**
 * Routes near the commuter, by a geofence around them (`routesNearby`). Only a rounded point is sent, and the query
 * is cached per rounded point, so walking a few metres does not refetch.
 */
export function useNearbyRoutes(point: { latitude: number; longitude: number } | undefined) {
  const api = useRoutesApi();
  const lat = point ? roundCoordinate(point.latitude) : 0;
  const lng = point ? roundCoordinate(point.longitude) : 0;
  return useQuery({
    queryKey: routeKeys.nearby(lat, lng),
    queryFn: ({ signal }) => api.nearby({ lat, lng }, signal).then((r) => r.routes),
    enabled: !!point,
    staleTime: ROUTE_STALE_MS,
  });
}
