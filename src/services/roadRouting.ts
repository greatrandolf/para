import type { LatLng } from 'react-native-maps';

/**
 * Road geometry between a route's stops, from OSRM (the same service the portal's route editor draws with).
 * Defaults to the public demo server, which is rate limited and for development only; set EXPO_PUBLIC_OSRM_URL
 * to your own OSRM server for production.
 */
const OSRM_URL = (process.env.EXPO_PUBLIC_OSRM_URL ?? 'https://router.project-osrm.org').replace(/\/$/, '');

/**
 * The road path through `stops`, in order. Falls back to straight lines between the stops when routing fails
 * (offline, server down), so the route still shows.
 */
export async function fetchRoadPath(stops: readonly LatLng[], signal?: AbortSignal): Promise<LatLng[]> {
  if (stops.length < 2) return [...stops];
  const coords = stops.map((p) => `${p.longitude.toFixed(6)},${p.latitude.toFixed(6)}`).join(';');
  try {
    const res = await fetch(
      `${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&continue_straight=false`,
      { signal },
    );
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const body = (await res.json()) as { code?: string; routes?: { geometry: { coordinates: [number, number][] } }[] };
    const line = body.routes?.[0]?.geometry.coordinates;
    if (body.code !== 'Ok' || !line || line.length < 2) throw new Error(`OSRM ${body.code ?? 'no route'}`);
    return line.map(([longitude, latitude]) => ({ latitude, longitude }));
  } catch (error) {
    if (signal?.aborted) throw error;
    return [...stops];
  }
}
