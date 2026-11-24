const { manilaDay, microToPeso } = jest.requireActual('@/hooks/useDriverEarnings');

describe('useDriverEarnings helpers', () => {
  it('uses the Manila calendar day like the backend', () => {
    // 2026-11-16 17:30 UTC is already 2026-11-17 01:30 in Manila.
    expect(manilaDay(Date.UTC(2026, 10, 16, 17, 30))).toBe('2026-11-17');
    expect(manilaDay(Date.UTC(2026, 10, 16, 15, 59))).toBe('2026-11-16');
  });

  it('turns micro-pesos into pesos', () => {
    expect(microToPeso(1_000_000)).toBe(1);
    expect(microToPeso(75_000)).toBeCloseTo(0.075);
    expect(microToPeso(0)).toBe(0);
  });
});
