import { StyleSheet } from 'react-native';

import { colors, radius, spacing, tiers } from '../theme';

export const styles = StyleSheet.create({
  /** Tier 2: white sheet with the level-3 shadow and rounded top corners. */
  background: {
    ...tiers.tier2,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  handle: { paddingTop: spacing.sm, paddingBottom: spacing.xs },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
  },
  /** White like the sheet, so the content reads as the sheet's card (AC52 white cards). */
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    backgroundColor: colors.surfaceCard,
  },
});
