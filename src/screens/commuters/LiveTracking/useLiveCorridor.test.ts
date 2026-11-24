import { JEEP_STALE_MS, LOAD_STALE_MS, seatsOf, visibleJeeps } from './useLiveCorridor';

const now = 1_000_000_000;
const fix = (at: number) => ({ lat: 10.3, lng: 123.9, heading: 90, speed: 5, at });
const meta = { routeId: 'r1', status: 'in_service', unitCode: 'PARA-01', plate: 'ABC-1234' };

describe('visibleJeeps', () => {
  it('shows connected jeeps in service with a recent fix', () => {
    const jeeps = visibleJeeps({ d1: { meta, position: fix(now - 5_000), presence: { online: true } } }, now);
    expect(jeeps).toEqual([
      expect.objectContaining({
        driverId: 'd1',
        unitCode: 'PARA-01',
        coordinate: { latitude: 10.3, longitude: 123.9 },
      }),
    ]);
  });

  it('hides jeeps on break, disconnected, without a fix, or with an old fix', () => {
    expect(visibleJeeps({ d1: { meta: { ...meta, status: 'on_break' }, position: fix(now) } }, now)).toEqual([]);
    expect(visibleJeeps({ d1: { meta, position: fix(now), presence: { online: false } } }, now)).toEqual([]);
    expect(visibleJeeps({ d1: { meta } }, now)).toEqual([]);
    expect(visibleJeeps({ d1: { meta, position: fix(now - JEEP_STALE_MS - 1) } }, now)).toEqual([]);
    expect(visibleJeeps(null, now)).toEqual([]);
  });
});

// Vacant seats from the driver's passenger load (Revision 21), shown to commuters.
describe('seatsOf', () => {
  it('gives the free seats from a recent load', () => {
    expect(seatsOf({ occupied: 18, capacity: 22, at: now - 60_000 }, now)).toEqual({ free: 4, capacity: 22 });
    expect(seatsOf({ occupied: 22, capacity: 22, at: now }, now)).toEqual({ free: 0, capacity: 22 });
  });

  it('shows nothing for a missing, invalid or stale load', () => {
    expect(seatsOf(undefined, now)).toBeUndefined();
    expect(seatsOf({ occupied: 3 }, now)).toBeUndefined();
    expect(seatsOf({ occupied: 3, capacity: 0, at: now }, now)).toBeUndefined();
    expect(seatsOf({ occupied: 3, capacity: 22, at: now - LOAD_STALE_MS - 1 }, now)).toBeUndefined();
  });

  it('is part of each visible jeep', () => {
    const [jeep] = visibleJeeps(
      {
        d1: {
          meta,
          position: fix(now - 5_000),
          presence: { online: true },
          load: { occupied: 10, capacity: 22, at: now },
        },
      },
      now,
    );
    expect(jeep.seats).toEqual({ free: 12, capacity: 22 });
  });
});
