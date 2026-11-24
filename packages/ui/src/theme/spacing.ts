/** DESIGN.md v3 `spacing` table (rem converted at 16px). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  gutter: 16,
  /** DESIGN `gutter-sm`. */
  gutterSm: 12,
  margin: 16,
  /** DESIGN `margin-lg`. */
  marginLg: 24,
} as const;

export type SpacingToken = keyof typeof spacing;
