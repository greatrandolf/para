import { BACK_JUMP_M, GLIDE_S, JUMP_M, isMoving, onFix, step, type Motion } from './deadReckoning';

const fix = (distance: number, seconds: number, lane: 'outbound' | 'inbound' = 'outbound') => ({
  lane,
  distance,
  at: seconds * 1000,
});

/** Advances the motion by `seconds` in 0.2 s steps, as the map's clock does. */
const run = (motion: Motion, seconds: number) => {
  let m = motion;
  const whole = Math.floor(seconds / 0.2 + 1e-9);
  for (let i = 0; i < whole; i++) m = step(m, 0.2);
  const rest = seconds - whole * 0.2;
  return rest > 1e-9 ? step(m, rest) : m;
};

describe('smooth jeep motion between fixes (Revision 18)', () => {
  it('starts at the first fix', () => {
    const m = onFix(undefined, fix(100, 0));
    expect(m).toMatchObject({ shown: 100, target: 100, limit: 100 });
    expect(isMoving(m)).toBe(false);
  });

  it('happy path: glides A to B in about 5 seconds, smoothly', () => {
    let m = onFix(onFix(undefined, fix(100, 0)), fix(150, 5)); // A=100, B=150
    m = run(m, 2.5);
    expect(m.shown).toBeCloseTo(125, 5); // halfway after half the time: steady speed, no jump
    m = run(m, 2.5);
    expect(m.shown).toBeCloseTo(150, 5);
  });

  it('no fix yet: keeps going at the same speed, for at most the same distance again', () => {
    let m = onFix(onFix(undefined, fix(100, 0)), fix(150, 5));
    m = run(m, 5); // at B
    m = run(m, 2.5);
    expect(m.shown).toBeCloseTo(175, 5); // 10 m/s, like A to B
    m = run(m, 10);
    expect(m.shown).toBeCloseTo(200, 5); // B + (B - A), then stops (bad scenario)
    expect(isMoving(m)).toBe(false);
  });

  it('the late fix ahead: glides to it from wherever it is, no jump', () => {
    let m = onFix(onFix(undefined, fix(100, 0)), fix(150, 5));
    m = run(m, 7.5); // forwarded to 175
    m = onFix(m, fix(210, 12.5));
    expect(m.shown).toBeCloseTo(175, 5); // still where it is drawn
    m = run(m, GLIDE_S / 2);
    expect(m.shown).toBeCloseTo(192.5, 5);
    m = run(m, GLIDE_S / 2);
    expect(m.shown).toBeCloseTo(210, 5);
  });

  it('a fix behind what is drawn: never goes back, holds until a fix is ahead', () => {
    let m = onFix(onFix(undefined, fix(100, 0)), fix(150, 5));
    m = run(m, 10); // drawn at 200 (forwarded)
    m = onFix(m, fix(180, 10)); // the jeep slowed down: 180 is behind 200
    m = run(m, 5);
    expect(m.shown).toBeCloseTo(200, 5); // held, not moved back
    m = onFix(m, fix(195, 15)); // still behind
    m = run(m, 5);
    expect(m.shown).toBeCloseTo(200, 5);
    m = onFix(m, fix(230, 20)); // ahead again
    m = run(m, GLIDE_S);
    expect(m.shown).toBeCloseTo(230, 5);
  });

  it('a parked jeep stays put', () => {
    let m = onFix(onFix(undefined, fix(100, 0)), fix(100, 30));
    m = run(m, 20);
    expect(m.shown).toBe(100);
  });

  it('a real jump (other lane, or over 1 km) moves there at once', () => {
    const m = onFix(onFix(undefined, fix(100, 0)), fix(150, 5));
    expect(onFix(m, fix(400, 10, 'inbound'))).toMatchObject({ lane: 'inbound', shown: 400 });
    expect(onFix(m, fix(100 + JUMP_M + 1, 10)).shown).toBe(100 + JUMP_M + 1);
  });

  it('a fix far behind (restart, GPS correction) moves there instead of freezing', () => {
    let m = onFix(onFix(undefined, fix(1000, 0)), fix(1050, 5));
    m = run(m, 5);
    m = onFix(m, fix(1050 - BACK_JUMP_M - 50, 10));
    expect(m.shown).toBe(1050 - BACK_JUMP_M - 50);
  });

  it('ignores a repeated or older fix', () => {
    const m = onFix(onFix(undefined, fix(100, 0)), fix(150, 5));
    expect(onFix(m, fix(150, 5))).toBe(m);
  });
});
