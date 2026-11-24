import type { Route } from '@packages/tanstack/query/routes';

import { roadPathQuery } from './useLiveCorridor';

const mockFetchRoadPath = jest.fn(async (stops: { latitude: number; longitude: number }[]) => stops);
jest.mock('@/services/roadRouting', () => ({
  fetchRoadPath: (...args: unknown[]) => mockFetchRoadPath(...(args as [never])),
}));

const stop = (lat: number, lng: number) => ({ id: `${lat}`, name: 's', kind: 'stop', lat, lng });
const route = (roadPaths?: Route['roadPaths']): Route => ({
  id: 'r1',
  code: '17B',
  name: '17B',
  status: 'active',
  directions: {
    outbound: { label: 'Out', via: '', waypoints: [stop(10.3, 123.9), stop(10.31, 123.9)] },
    inbound: { label: 'In', via: '', waypoints: [stop(10.31, 123.9), stop(10.3, 123.9)] },
  },
  ...(roadPaths ? { roadPaths } : {}),
});

const run = (r: Route) => roadPathQuery(r).queryFn({ signal: new AbortController().signal });

describe('roadPathQuery (Revision 17)', () => {
  beforeEach(() => mockFetchRoadPath.mockClear());

  it("uses Google's road from the backend, without asking OSRM", async () => {
    const paths = await run(route({ outbound: '_p~iF~ps|U_ulLnnqC', inbound: '_p~iF~ps|U' }));
    expect(paths.outbound.points).toEqual([
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
    ]);
    expect(paths.inbound.points).toHaveLength(1);
    expect(mockFetchRoadPath).not.toHaveBeenCalled();
  });

  it('falls back to our own lines when the backend sends no road (undo switch)', async () => {
    await run(route());
    expect(mockFetchRoadPath).toHaveBeenCalledTimes(2);
  });

  it('uses a new cache entry when the road changes or is switched off', () => {
    const key = (r: Route) => JSON.stringify(roadPathQuery(r).queryKey);
    expect(key(route({ outbound: 'a' }))).not.toEqual(key(route()));
  });
});
