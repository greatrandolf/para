import { ROUTE_LANES } from './corridorRoute';
import { bearingBetween, buildLoop, CIRCUIT, circuitFraction, poseAt, turnTowards } from './jeepMotion';

describe('jeepMotion', () => {
  it('starts on the first Colon-lane point at fraction 0', () => {
    const first = ROUTE_LANES.colon[0];
    const pose = poseAt(CIRCUIT, 0);
    expect(pose.coordinate.latitude).toBeCloseTo(first.latitude, 6);
    expect(pose.coordinate.longitude).toBeCloseTo(first.longitude, 6);
  });

  it('wraps: fraction 1 is the same place as fraction 0', () => {
    const a = poseAt(CIRCUIT, 0.3);
    const b = poseAt(CIRCUIT, 1.3);
    expect(b.coordinate.latitude).toBeCloseTo(a.coordinate.latitude, 6);
    expect(b.coordinate.longitude).toBeCloseTo(a.coordinate.longitude, 6);
  });

  it('the Colon lane runs south overall and the Apas lane runs north overall', () => {
    const colon = ROUTE_LANES.colon;
    const apas = ROUTE_LANES.apas;
    const colonBearing = bearingBetween(colon[0], colon[colon.length - 1]);
    const apasBearing = bearingBetween(apas[0], apas[apas.length - 1]);
    expect(colonBearing).toBeGreaterThan(150);
    expect(colonBearing).toBeLessThan(230);
    expect(apasBearing > 330 || apasBearing < 30).toBe(true);
  });

  it('starts an Apas-lane jeep on the Apas lane', () => {
    const apasStart = poseAt(CIRCUIT, circuitFraction('apas', 0)).coordinate;
    const carbon = ROUTE_LANES.apas[0];
    // The two lanes meet at Carbon with a ~40 m offset, so allow 0.0005 degrees (~50 m).
    expect(apasStart.latitude).toBeCloseTo(carbon.latitude, 3);
    expect(apasStart.longitude).toBeCloseTo(carbon.longitude, 3);
  });

  it('reports compass bearings: north is 0, east is 90', () => {
    expect(bearingBetween({ latitude: 10, longitude: 123 }, { latitude: 11, longitude: 123 })).toBeCloseTo(0, 6);
    expect(bearingBetween({ latitude: 10, longitude: 123 }, { latitude: 10, longitude: 124 })).toBeCloseTo(90, 0);
  });

  it('builds a closed loop from its points', () => {
    const square = buildLoop([
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
      { latitude: 1, longitude: 1 },
      { latitude: 1, longitude: 0 },
    ]);
    expect(square.points).toHaveLength(4);
    expect(square.total).toBeGreaterThan(0);
  });
});

describe('turnTowards', () => {
  it('takes the short way round across north', () => {
    expect(turnTowards(350, 10, 90)).toBeCloseTo(10, 6);
    expect(turnTowards(10, 350, 90)).toBeCloseTo(350, 6);
  });

  it('limits the turn to the maximum step', () => {
    expect(turnTowards(0, 100, 30)).toBeCloseTo(30, 6);
    expect(turnTowards(90, 0, 30)).toBeCloseTo(60, 6);
  });

  it('reaches the target once within one step', () => {
    expect(turnTowards(40, 45, 30)).toBeCloseTo(45, 6);
  });
});
