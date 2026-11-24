/** Passenger load (Revision 21): occupied seats against the unit's seats. */

export type LoadLevel = 'empty' | 'light' | 'moderate' | 'heavy' | 'full';

export const LOAD_LABEL: Record<LoadLevel, string> = {
  empty: 'EMPTY',
  light: 'LIGHT LOAD',
  moderate: 'MODERATE LOAD',
  heavy: 'HEAVY LOAD',
  full: 'FULL',
};

/** Keeps a seat count whole and within 0..capacity. */
export const clampSeats = (occupied: number, capacity: number) => Math.max(0, Math.min(capacity, Math.round(occupied)));

/** Whole percent full. */
export const loadPercent = (occupied: number, capacity: number) =>
  capacity > 0 ? Math.round((clampSeats(occupied, capacity) / capacity) * 100) : 0;

/** Empty at 0 %, light under 40 %, moderate under 75 %, heavy under 100 %, full at 100 %. */
export function loadLevel(occupied: number, capacity: number): LoadLevel {
  const seats = clampSeats(occupied, capacity);
  if (seats <= 0) return 'empty';
  if (seats >= capacity) return 'full';
  const pct = (seats / capacity) * 100;
  return pct < 40 ? 'light' : pct < 75 ? 'moderate' : 'heavy';
}

/** The seats for a point on the slider (0..1 across the track). */
export const seatsAtFraction = (fraction: number, capacity: number) =>
  clampSeats(Math.max(0, Math.min(1, fraction)) * capacity, capacity);

/** Quick presets: empty, half, heavy (about 80 %), standing (every seat). */
export const loadPresets = (capacity: number) => [
  { key: 'empty', label: 'Empty', seats: 0 },
  { key: 'half', label: 'Half', seats: clampSeats(capacity / 2, capacity) },
  { key: 'heavy', label: 'Heavy', seats: clampSeats(capacity * 0.8, capacity) },
  { key: 'standing', label: 'Standing', seats: capacity },
];
