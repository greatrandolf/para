import { colors } from './colors';

/**
 * DESIGN.md v3 "Elevation & Depth". Light mode brings soft shadows back
 * (`boxShadow`, New Architecture). Glows are rebased to the #FF5500 brand.
 */
export const elevation = {
  /** Level 1: docked cards (`tiers.tier1`, `GradientCard` outer view). */
  level1: '0px 2px 8px -2px rgba(15, 23, 42, 0.05)',
  /** Level 2: floating controls (recenter FAB, map callouts, floating chips). */
  level2: '0px 10px 20px -5px rgba(15, 23, 42, 0.10), 0px 4px 6px -2px rgba(15, 23, 42, 0.04)',
  /** Level 3: modal and drawer sheets (`tiers.tier2`). */
  level3: '0px -16px 36px -8px rgba(15, 23, 42, 0.16)',
  /** Primary CTA glow. */
  ctaGlow: '0px 4px 14px rgba(255, 85, 0, 0.35)',
  /** Vehicle pins, "YOU" pin, tracked segment. */
  glowBrand: '0px 0px 16px rgba(255, 85, 0, 0.45)',
  /** Live pulse. */
  glowLive: '0px 0px 12px rgba(0, 179, 126, 0.40)',
  /** Focused search input (DESIGN orange focus ring). */
  focusRing: '0px 0px 0px 3px rgba(255, 85, 0, 0.25)',
} as const;

export type ElevationToken = keyof typeof elevation;

/** Surface tier style objects (spread into `StyleSheet.create`). */
export const tiers = {
  /** Ground level: screens, maps. */
  canvas: { backgroundColor: colors.canvas },
  /** Docked cards: white with a soft border and the level-1 shadow. */
  tier1: { backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, boxShadow: elevation.level1 },
  /** Sheets and modals: white with the level-3 shadow. */
  tier2: { backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, boxShadow: elevation.level3 },
  /** Light-blue info box inside a card. */
  infoBox: { backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.surfaceContainerHigh },
} as const;

export type TierName = keyof typeof tiers;
