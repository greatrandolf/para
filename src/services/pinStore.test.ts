import { MAX_PIN_ATTEMPTS, checkPin, clearPin, hasPin, isValidPin, savePin } from './pinStore';

const mockMemory = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: async (key: string) => mockMemory.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => void mockMemory.set(key, value),
  deleteItemAsync: async (key: string) => void mockMemory.delete(key),
}));

let mockUuid = 0;
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: async (_algorithm: string, value: string) =>
    [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
  randomUUID: () => `salt-${++mockUuid}`,
}));

describe('pinStore', () => {
  beforeEach(() => mockMemory.clear());

  it('accepts only 6 digits', () => {
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('12345a')).toBe(false);
  });

  it('stores a salted hash, never the PIN', async () => {
    await savePin('driver-a', '482913');
    const stored = [...mockMemory.values()].join();
    expect(stored).not.toContain('482913');
    expect(await hasPin('driver-a')).toBe(true);
  });

  it('belongs to one driver', async () => {
    await savePin('driver-a', '482913');
    expect(await hasPin('driver-b')).toBe(false);
    expect((await checkPin('driver-b', '482913')).ok).toBe(false);
  });

  it('unlocks with the right PIN and resets the failure count', async () => {
    await savePin('driver-a', '482913');
    expect((await checkPin('driver-a', '000000')).attemptsLeft).toBe(MAX_PIN_ATTEMPTS - 1);
    expect(await checkPin('driver-a', '482913')).toEqual({ ok: true, attemptsLeft: MAX_PIN_ATTEMPTS });
    expect((await checkPin('driver-a', '000000')).attemptsLeft).toBe(MAX_PIN_ATTEMPTS - 1);
  });

  it('runs out of tries after five wrong PINs', async () => {
    await savePin('driver-a', '482913');
    let last = { ok: true, attemptsLeft: MAX_PIN_ATTEMPTS };
    for (let i = 0; i < MAX_PIN_ATTEMPTS; i++) last = await checkPin('driver-a', '111111');
    expect(last).toEqual({ ok: false, attemptsLeft: 0 });
  });

  it('is forgotten on sign-out', async () => {
    await savePin('driver-a', '482913');
    await clearPin();
    expect(await hasPin('driver-a')).toBe(false);
  });
});
