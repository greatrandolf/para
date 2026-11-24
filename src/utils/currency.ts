export type FormatPesoOptions = {
  /** Number of decimals. Defaults to 2. */
  decimals?: number;
  /** Prefix positive values with `+`. Negative values always get `-`. */
  sign?: boolean;
};

const PESO = '₱';

/** Groups the integer digits with commas, e.g. `1650` -> `1,650`. No `Intl`. */
export function formatCount(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  const grouped = Math.abs(safe)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return safe < 0 ? `-${grouped}` : grouped;
}

/**
 * Formats an amount as Philippine pesos, e.g. `₱45.00`, `-₱1.00`, `+₱50.00`,
 * `₱1,420.50`. Formats by hand (no `Intl`) so Hermes and Jest agree.
 */
export function formatPeso(amount: number, { decimals = 2, sign = false }: FormatPesoOptions = {}): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(safe);
  const fixed = abs.toFixed(decimals);
  const [whole, fraction] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const body = fraction !== undefined ? `${grouped}.${fraction}` : grouped;
  const isZero = Number(fixed) === 0;
  let prefix = '';
  if (safe < 0 && !isZero) prefix = '-';
  else if (sign && safe > 0 && !isZero) prefix = '+';
  return `${prefix}${PESO}${body}`;
}
