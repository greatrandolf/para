import { checkPin, MAX_PIN_FROM_ME_M, pinLabel, waitingPoint } from './waitingPin';

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

describe('checkPin', () => {
  it('allows a pin within walking distance', () => {
    expect(checkPin(north(MAX_PIN_FROM_ME_M - 50), me)).toEqual({ ok: true });
  });

  it('refuses a pin too far from the commuter', () => {
    expect(checkPin(north(MAX_PIN_FROM_ME_M + 200), me)).toEqual({
      ok: false,
      message: 'Pin a spot within 2.0 km of you.',
    });
  });

  it('allows any pin without GPS', () => {
    expect(checkPin(north(10_000), undefined)).toEqual({ ok: true });
  });
});

describe('pinLabel', () => {
  it('says how far the pin is', () => {
    expect(pinLabel(north(352), me)).toBe('Waiting pin • 350 m from you');
    expect(pinLabel(north(5), me)).toBe('Waiting pin • you are here');
    expect(pinLabel(north(352), undefined)).toBe('Waiting pin');
  });
});
