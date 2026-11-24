/** Route shapes returned by the para-backend route callables (see para-backend/docs/api.md). */

export type DirectionKey = 'outbound' | 'inbound';

export type RouteStop = {
  id: string;
  name: string;
  kind: string;
  lat: number;
  lng: number;
};

/** `waypoints` come in route order (first stop to last). */
export type RouteDirection = { label: string; via: string; waypoints: RouteStop[] };

export type RouteSummary = {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'paused';
  /** Base fare in pesos and round-trip length (0 when not set), from the portal. */
  baseFare?: number;
  roundtripKm?: number;
};

export type Route = RouteSummary & {
  directions: Record<DirectionKey, RouteDirection>;
  /**
   * The real road per direction from Google (encoded polyline), when the backend has it and it is switched on
   * (config/commute.roadGeometry). Without it the app works out its own lines.
   */
  roadPaths?: Partial<Record<DirectionKey, string>>;
};

/** `routesForCommute`: `preferred` is null when no active route has the code. */
export type CommuteRoutes = { preferred: Route | null; others: Route[] };

/**
 * `routesNearby`: active routes whose line passes inside the geofence, nearest first. `distanceM` is to the route
 * line (its path through the stops), `nearestStopM` to its nearest stop. When no route is inside the geofence the
 * backend returns the nearest routes anyway, with `withinRadius: false` (missing on older backends).
 */
export type NearbyRoute = Route & { distanceM: number; nearestStopM: number; withinRadius?: boolean };
