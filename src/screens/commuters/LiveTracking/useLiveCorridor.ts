import { useQuery } from '@tanstack/react-query';
import { equalTo, onValue, orderByChild, query, ref } from 'firebase/database';
import { useEffect, useMemo, useState } from 'react';
import type { LatLng } from 'react-native-maps';

import { realtimeDb } from '@/services/firebase';
import { fetchRoadPath } from '@/services/roadRouting';
import type { DirectionKey, Route } from '@packages/tanstack/query/routes';

import { buildPath, decodePolyline, type RoutePath } from './livePath';

/** A jeep sharing live GPS on the route (from the driver app, via the Realtime Database). */
export type LiveJeep = {
  driverId: string;
  unitCode: string;
  plate: string;
  coordinate: LatLng;
  /** GPS heading in degrees, when the phone reported one. */
  heading?: number;
  /** Metres per second, when reported. */
  speed?: number;
  /** Server time of the fix (ms). */
  at: number;
  /** Vacant seats from the driver's passenger load, when set recently (see LOAD_STALE_MS). */
  seats?: { free: number; capacity: number };
};

/** A passenger load older than this is not shown (the driver may have forgotten to update it). */
export const LOAD_STALE_MS = 30 * 60 * 1000;

/** A jeep whose last fix is older than this is no longer shown (the app re-sends at least every 30 s). */
export const JEEP_STALE_MS = 2 * 60 * 1000;

type RawLive = {
  meta?: { routeId?: string; status?: string; unitCode?: string; plate?: string };
  position?: { lat?: number; lng?: number; heading?: number; speed?: number; at?: number };
  presence?: { online?: boolean };
  /** The driver's passenger load (Revision 21): `{ occupied, capacity, at }`. */
  load?: { occupied?: number; capacity?: number; at?: number };
};

/** Vacant seats from a live record's load, or undefined when missing, invalid or stale. */
export function seatsOf(load: RawLive['load'], now: number): LiveJeep['seats'] {
  const { occupied, capacity, at } = load ?? {};
  if (typeof occupied !== 'number' || typeof capacity !== 'number' || typeof at !== 'number') return undefined;
  if (capacity < 1 || occupied < 0 || now - at > LOAD_STALE_MS) return undefined;
  return { free: Math.max(0, capacity - occupied), capacity };
}

/** Only jeeps in service, connected, and with a recent fix. */
export function visibleJeeps(raw: Record<string, RawLive> | null, now: number): LiveJeep[] {
  return Object.entries(raw ?? {}).flatMap(([driverId, v]) => {
    const p = v.position;
    if (v.meta?.status !== 'in_service' || v.presence?.online === false) return [];
    if (typeof p?.lat !== 'number' || typeof p.lng !== 'number' || typeof p.at !== 'number') return [];
    if (now - p.at > JEEP_STALE_MS) return [];
    return [
      {
        driverId,
        unitCode: v.meta.unitCode ?? '',
        plate: v.meta.plate ?? '',
        coordinate: { latitude: p.lat, longitude: p.lng },
        heading: p.heading,
        speed: p.speed,
        at: p.at,
        seats: seatsOf(v.load, now),
      },
    ];
  });
}

const stopsOf = (route: Route | undefined, key: DirectionKey): LatLng[] =>
  (route?.directions[key]?.waypoints ?? []).map((w) => ({ latitude: w.lat, longitude: w.lng }));

export type LiveCorridor = {
  route?: Route;
  /** Road path per direction (first stop to last), once routed. */
  paths?: Record<DirectionKey, RoutePath>;
  stops: Record<DirectionKey, LatLng[]>;
  /** Stops with their names, per direction, in route order. */
  namedStops: Record<DirectionKey, { name: string; coordinate: LatLng }[]>;
  jeeps: LiveJeep[];
  loading: boolean;
};

/**
 * Every jeep sharing live GPS on each of `routeIds` (Realtime Database `driverLocations`, indexed by
 * `meta/routeId`), keyed by route id. Old fixes drop out as time passes (checked every 10 s, on the server clock).
 */
export function useRouteJeeps(routeIds: readonly string[]): Record<string, LiveJeep[]> {
  const idsKey = [...routeIds].sort().join(',');
  const [raw, setRaw] = useState<Record<string, Record<string, RawLive> | null>>({});
  const [serverOffset, setServerOffset] = useState(0);
  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) return;
    let db;
    try {
      db = realtimeDb();
    } catch {
      return; // live tracking not set up in this build
    }
    const offs = ids.map((routeId) =>
      onValue(
        query(ref(db, 'driverLocations'), orderByChild('meta/routeId'), equalTo(routeId)),
        (snap) => setRaw((current) => ({ ...current, [routeId]: snap.val() as Record<string, RawLive> | null })),
        () => setRaw((current) => ({ ...current, [routeId]: null })),
      ),
    );
    const offClock = onValue(ref(db, '.info/serverTimeOffset'), (snap) => setServerOffset(Number(snap.val()) || 0));
    return () => {
      offs.forEach((off) => off());
      offClock();
    };
  }, [idsKey]);

  // Re-check freshness now and then, so a jeep that stopped reporting disappears.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 10_000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    const out: Record<string, LiveJeep[]> = {};
    for (const routeId of idsKey ? idsKey.split(',') : []) {
      out[routeId] = visibleJeeps(raw[routeId] ?? null, tick + serverOffset);
    }
    return out;
  }, [idsKey, raw, tick, serverOffset]);
}

/** The road between a route's stops, per direction (OSRM; straight lines if routing fails). Shared cache key. */
export function roadPathQuery(route: Route | undefined) {
  const stops = { outbound: stopsOf(route, 'outbound'), inbound: stopsOf(route, 'inbound') };
  const google = route?.roadPaths;
  // Google's real road (from the backend) when the route has it; otherwise our own lines through the stops.
  const road = (key: DirectionKey, signal: AbortSignal) => {
    const encoded = google?.[key];
    return encoded ? Promise.resolve(decodePolyline(encoded)) : fetchRoadPath(stops[key], signal);
  };
  return {
    queryKey: ['roadPath', route?.id, JSON.stringify(stops), google?.outbound ?? '', google?.inbound ?? ''] as const,
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const [outbound, inbound] = await Promise.all([road('outbound', signal), road('inbound', signal)]);
      return { outbound: buildPath(outbound), inbound: buildPath(inbound) } as Record<DirectionKey, RoutePath>;
    },
    enabled: !!route,
    staleTime: Infinity,
  };
}

/**
 * The selected route on the map: its stops (from the portal's route editor), the road between them, and the jeeps
 * sharing live GPS on it (from `useRouteJeeps`).
 */
export function useLiveCorridor(route: Route | undefined, jeeps: LiveJeep[]): LiveCorridor {
  const stops = useMemo(() => ({ outbound: stopsOf(route, 'outbound'), inbound: stopsOf(route, 'inbound') }), [route]);
  const namedStops = useMemo(() => {
    const of = (key: DirectionKey) =>
      (route?.directions[key]?.waypoints ?? []).map((w) => ({
        name: w.name,
        coordinate: { latitude: w.lat, longitude: w.lng },
      }));
    return { outbound: of('outbound'), inbound: of('inbound') };
  }, [route]);
  const roads = useQuery(roadPathQuery(route));

  return { route, paths: roads.data, stops, namedStops, jeeps, loading: roads.isLoading };
}
