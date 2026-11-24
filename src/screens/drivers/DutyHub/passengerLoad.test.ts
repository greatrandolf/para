import { clampSeats, loadLevel, loadPercent, loadPresets, seatsAtFraction } from './passengerLoad';

describe('passenger load (Revision 21)', () => {
  it('keeps seats whole and within the unit', () => {
    expect(clampSeats(15.4, 22)).toBe(15);
    expect(clampSeats(-3, 22)).toBe(0);
    expect(clampSeats(30, 22)).toBe(22);
  });

  it('gives the percentage and level of the design (15 / 22 = 68 %, moderate)', () => {
    expect(loadPercent(15, 22)).toBe(68);
    expect(loadLevel(15, 22)).toBe('moderate');
    expect([0, 5, 15, 18, 22].map((s) => loadLevel(s, 22))).toEqual(['empty', 'light', 'moderate', 'heavy', 'full']);
  });

  it('maps a point on the slider to whole seats', () => {
    expect(seatsAtFraction(0, 22)).toBe(0);
    expect(seatsAtFraction(0.68, 22)).toBe(15);
    expect(seatsAtFraction(1.2, 22)).toBe(22);
    expect(seatsAtFraction(-1, 22)).toBe(0);
  });

  it('offers the presets of the design for 22 seats', () => {
    expect(loadPresets(22).map((p) => [p.label, p.seats])).toEqual([
      ['Empty', 0],
      ['Half', 11],
      ['Heavy', 18],
      ['Standing', 22],
    ]);
  });
});
