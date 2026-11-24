/**
 * DESIGN.md v3 `rounded` table (rem x 16). `base` is DESIGN `DEFAULT`
 * (ROUND_EIGHT). Usage was checked against the light reference image (Q13):
 * - `base` (8): buttons, icon buttons, segmented controls, icon tiles, info
 *   boxes, stat tiles, map callouts, map frames.
 * - `md` (12): cards and gradient cards.
 * - `lg` (16): the confirm modal and sheet top corners.
 * - `full`: badges, chips, balance pill, search input, progress bars, FAB,
 *   avatars, pins, dots and timeline nodes.
 * - `sm` (4): route segment line ends.
 */
export const radius = {
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
