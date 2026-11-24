import {
  angleBetween,
  buildPath,
  decodePolyline,
  distanceM,
  formatDistance,
  nearCorridor,
  nearestStop,
  offsetRight,
  pickDirection,
  poseAlong,
  project,
  shiftRight,
} from './livePath';

// A straight road running north (about 1.1 km), and the same road southbound.
const north = [
  { latitude: 10.3, longitude: 123.9 },
  { latitude: 10.305, longitude: 123.9 },
  { latitude: 10.31, longitude: 123.9 },
];
const outbound = buildPath(north);
const inbound = buildPath([...north].reverse());

describe('livePath', () => {
  it('measures the path in metres', () => {
    expect(outbound.length).toBeGreaterThan(1100);
    expect(outbound.length).toBeLessThan(1120);
  });

  it('projects a fix beside the road onto it', () => {
    const fix = { latitude: 10.305, longitude: 123.9003 }; // ~33 m east of the middle
    const p = project(outbound, fix);
    expect(p.distance).toBeCloseTo(outbound.length / 2, -1);
    expect(p.offset).toBeGreaterThan(25);
    expect(p.offset).toBeLessThan(40);
    expect(p.bearing).toBeCloseTo(0, 0);
  });

  it('places a point along the road with the road bearing', () => {
    const pose = poseAlong(outbound, 100);
    expect(distanceM(north[0], pose.coordinate)).toBeCloseTo(100, 0);
    expect(pose.bearing).toBeCloseTo(0, 0);
    expect(poseAlong(inbound, 100).bearing).toBeCloseTo(180, 0);
  });

  it('picks the direction from the GPS heading when both directions share the road', () => {
    const paths = { outbound, inbound };
    const fix = { latitude: 10.304, longitude: 123.9 };
    expect(pickDirection(paths, fix, 2, undefined)?.key).toBe('outbound');
    expect(pickDirection(paths, fix, 178, undefined)?.key).toBe('inbound');
  });

  it('keeps the previous direction when parked (no heading)', () => {
    const paths = { outbound, inbound };
    const fix = { latitude: 10.304, longitude: 123.9 };
    expect(pickDirection(paths, fix, undefined, 'inbound')?.key).toBe('inbound');
  });

  it('leaves a fix far from the route unsnapped', () => {
    expect(pickDirection({ outbound, inbound }, { latitude: 10.304, longitude: 123.91 }, 0, undefined)).toBeUndefined();
  });

  it('tells fixes on the corridor from bad GPS far away', () => {
    expect(nearCorridor({ outbound, inbound }, { latitude: 10.304, longitude: 123.905 })).toBe(true); // ~550 m
    expect(nearCorridor({ outbound, inbound }, { latitude: 37.422, longitude: -122.084 })).toBe(false);
  });

  it('puts each direction on the right-hand side of the road, apart from the other', () => {
    const goingNorth = offsetRight(north, 10);
    const goingSouth = offsetRight([...north].reverse(), 10);
    // Northbound keeps to the east side, southbound to the west.
    expect(goingNorth[1].longitude).toBeGreaterThan(north[1].longitude);
    expect(goingSouth[1].longitude).toBeLessThan(north[1].longitude);
    expect(distanceM(goingNorth[1], north[1])).toBeCloseTo(10, 0);
    expect(distanceM(goingNorth[1], goingSouth[1])).toBeCloseTo(20, 0);
  });

  it('moves a point to the right of its heading', () => {
    const p = { latitude: 10.3, longitude: 123.9 };
    expect(shiftRight(p, 0, 10).longitude).toBeGreaterThan(p.longitude); // heading north: right is east
    expect(shiftRight(p, 90, 10).latitude).toBeLessThan(p.latitude); // heading east: right is south
    expect(shiftRight(p, 0, 0)).toBe(p);
  });

  it('measures angles the short way round', () => {
    expect(angleBetween(350, 10)).toBe(20);
    expect(angleBetween(90, 270)).toBe(180);
  });
});

describe('nearestStop', () => {
  const stops = {
    outbound: [
      { name: 'Apas', coordinate: { latitude: 10.3389, longitude: 123.9056 } },
      { name: 'Kamputhaw', coordinate: { latitude: 10.3169, longitude: 123.8928 } },
    ],
    inbound: [{ name: 'Sto. Niño', coordinate: { latitude: 10.2937, longitude: 123.9012 } }],
  };

  it('picks the closest stop of either direction, with walking time', () => {
    const near = nearestStop(stops, { latitude: 10.3175, longitude: 123.8935 });
    expect(near).toMatchObject({ name: 'Kamputhaw', direction: 'outbound' });
    expect(near?.distance).toBeGreaterThan(80);
    expect(near?.distance).toBeLessThan(120);
    expect(near?.walkMinutes).toBe(1);
    expect(nearestStop(stops, { latitude: 10.294, longitude: 123.9 })?.name).toBe('Sto. Niño');
  });

  it('has no stop without stops', () => {
    expect(nearestStop({ outbound: [] }, { latitude: 10, longitude: 123 })).toBeUndefined();
  });

  it('formats distances', () => {
    expect(formatDistance(347)).toBe('350 m');
    expect(formatDistance(1234)).toBe('1.2 km');
  });
});

describe('decodePolyline', () => {
  it("decodes Google's reference polyline", () => {
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(points).toEqual([
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
      { latitude: 43.252, longitude: -126.453 },
    ]);
  });

  it('gives no points for an empty string', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});
