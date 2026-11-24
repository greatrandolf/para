import type { FunctionsClient } from '../client';
import type { CommuteRoutes, NearbyRoute, Route, RouteSummary } from './types';

/** Typed wrappers around the para-backend route callables (any signed-in user may read routes). */
export const routesApi = (client: FunctionsClient) => ({
  list: (signal?: AbortSignal) => client.call<{ routes: RouteSummary[] }>('routesList', {}, signal),
  get: (routeId: string, signal?: AbortSignal) => client.call<{ route: Route }>('routesGet', { routeId }, signal),
  /** The preferred route (by code) and the other active routes that run along its corridor. */
  forCommute: (preferredCode: string, signal?: AbortSignal) =>
    client.call<CommuteRoutes>('routesForCommute', { preferredCode }, signal),
  /**
   * Active routes whose line passes inside the backend's geofence around the point (config/commute), nearest
   * first; when none does, the nearest routes anyway (`withinRadius: false`).
   */
  nearby: (point: { lat: number; lng: number }, signal?: AbortSignal) =>
    client.call<{ routes: NearbyRoute[] }>('routesNearby', point, signal),
});
