import { formatCount, formatPeso } from './currency';

describe('formatPeso', () => {
  it('formats with two decimals by default', () => {
    expect(formatPeso(45)).toBe('₱45.00');
  });

  it('adds thousands separators', () => {
    expect(formatPeso(1420.5)).toBe('₱1,420.50');
    expect(formatPeso(42150)).toBe('₱42,150.00');
    expect(formatPeso(1234567.891)).toBe('₱1,234,567.89');
  });

  it('prefixes negatives with a minus before the peso sign', () => {
    expect(formatPeso(-1)).toBe('-₱1.00');
  });

  it('prefixes positives with + when sign is set', () => {
    expect(formatPeso(50, { sign: true })).toBe('+₱50.00');
  });

  it('never signs zero', () => {
    expect(formatPeso(0, { sign: true })).toBe('₱0.00');
    expect(formatPeso(-0.001)).toBe('₱0.00');
  });

  it('respects the decimals option', () => {
    expect(formatPeso(20, { decimals: 1 })).toBe('₱20.0');
    expect(formatPeso(100, { decimals: 0 })).toBe('₱100');
  });

  it('treats non-finite input as zero', () => {
    expect(formatPeso(Number.NaN)).toBe('₱0.00');
  });
});

describe('formatCount', () => {
  it('groups thousands', () => {
    expect(formatCount(1650)).toBe('1,650');
    expect(formatCount(1000)).toBe('1,000');
    expect(formatCount(412)).toBe('412');
    expect(formatCount(-12345)).toBe('-12,345');
  });
});
