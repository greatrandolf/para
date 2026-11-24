import { roundCoordinate } from './hooks';

jest.mock('../QueryProvider', () => ({ useFunctionsClient: () => ({}) }));

describe('roundCoordinate', () => {
  it('rounds to 3 decimals (~110 m), so only a coarse point leaves the phone', () => {
    expect(roundCoordinate(10.318572)).toBe(10.319);
    expect(roundCoordinate(123.899239)).toBe(123.899);
    expect(roundCoordinate(-0.0004)).toBe(-0);
  });
});
