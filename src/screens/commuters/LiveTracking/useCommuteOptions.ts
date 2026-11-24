import { useMemo } from 'react';
import type { LatLng } from 'react-native-maps';

import type { DirectionKey, Route } from '@packages/tanstack/query/routes';

import { buildCommuteOptions, distanceText, type CommuteOption, type DirectionChoice } from './commuteOptions';
import type { RoutePath } from './livePath';
import type { LiveJeep } from './useLiveCorridor';
import { useRoutesOnMyWay } from './useRoutesOnMyWay';

export type CommuteOptions = {
  options: CommuteOption[];
  /** The preferred route, when it is active. */
  preferred?: Route;
  jeepsByRoute: Record<string, LiveJeep[]>;
  /** Each route's road per direction, when known (waiting-pin: which lane the pin is on). */
  pathsByRoute: Record<string, Record<DirectionKey, RoutePath> | undefined>;
  loading: boolean;
  /** Why there is no list (loading, an error, no routes), or that the routes shown are not close to the commuter. */
  notice?: string;
};

/** The Live Map's route list: the routes on the commuter's way, each with an ETA to their boarding stop. */
export function useCommuteOptions(
  preferredCode: string,
  me: LatLng | undefined,
  /** The commuter's direction of travel (or the lane nearest a waiting pin): ETAs count only jeeps coming that way. */
  direction?: DirectionChoice,
): CommuteOptions {
  const { preferred, routes, jeepsByRoute, pathsByRoute, loading, error, farthest } = useRoutesOnMyWay(
    preferredCode,
    me,
  );
  const options = useMemo(
    () =>
      buildCommuteOptions(
        preferred,
        routes.filter((r) => r.id !== preferred?.id),
        jeepsByRoute,
        me,
        pathsByRoute,
        direction,
        // With a location the routes come from the geofence, nearest first: keep that order.
        me ? routes : undefined,
      ),
    [preferred, routes, jeepsByRoute, me, pathsByRoute, direction],
  );

  const notice = loading
    ? 'Finding routes on your way…'
    : error
      ? `Could not load routes: ${error.message}`
      : options.length === 0
        ? 'No routes found near you yet.'
        : farthest
          ? `No route passes close to you. Showing the nearest: ${farthest.code}, ${distanceText(farthest.distanceM)} away.`
          : undefined;

  return { options, preferred, jeepsByRoute, pathsByRoute, loading, notice };
}
