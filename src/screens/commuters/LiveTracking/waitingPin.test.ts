import { pinLabel, waitingPoint } from './waitingPin';

const me = { latitude: 10.3186, longitude: 123.8977 };
// ~1 m per 0.000009° of latitude.
const north = (m: number) => ({ latitude: me.latitude + m / 111_320, longitude: me.longitude });

describe('waitingPoint', () => {
  it('uses the pin when set, else GPS', () => {
    const pin = north(300);
    expect(waitingPoint(pin, me)).toBe(pin);
    expect(waitingPoint(undefined, me)).toBe(me);
    expect(waitingPoint(pin, undefined)).toBe(pin);
    expect(waitingPoint(undefined, undefined)).toBeUndefined();
  });
});

describe('pinLabel', () => {
  it('says how far the pin is', () => {
    expect(pinLabel(north(352), me)).toBe('Waiting pin • 350 m from you');
    expect(pinLabel(north(5), me)).toBe('Waiting pin • you are here');
    expect(pinLabel(north(352), undefined)).toBe('Waiting pin');
  });
});
