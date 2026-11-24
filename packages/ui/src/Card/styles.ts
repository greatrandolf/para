import { StyleSheet } from 'react-native';

import { colors, radius, spacing, tiers } from '../theme';

export const styles = StyleSheet.create({
  // Q13: section cards use the 12px radius (the reference image's cards are rounder than the 8px inner boxes).
  base: { borderRadius: radius.md, padding: spacing.md },
  /** Tier 1: white docked card with a soft border and the level-1 shadow. */
  elevated: { ...tiers.tier1 },
  /** Light-blue info box inside a card. */
  tinted: { ...tiers.infoBox },
  /** Tier 2: sheets and overlays (level-3 shadow). */
  sheet: { ...tiers.tier2 },
  /** Offline route card. */
  dashed: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  /** Fare / wallet card: amber tint with a soft border. */
  fare: { backgroundColor: colors.amberTint, borderWidth: 1, borderColor: colors.borderSubtle },
});

export const paddingStyles = StyleSheet.create({
  none: { padding: 0 },
  sm: { padding: spacing.gutterSm },
  md: { padding: spacing.md },
  lg: { padding: spacing.lg - 4 },
});
