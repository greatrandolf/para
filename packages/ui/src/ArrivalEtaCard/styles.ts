import { StyleSheet } from 'react-native';

import { colors, elevation, radius, spacing } from '../theme';

/**
 * Orange arrival card (live-arrival-card): lock tile, label with the pass tag, where to board and a second line on the
 * left; a see-through box with the minutes on the right.
 */
export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gutterSm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.brandAction,
    boxShadow: elevation.ctaGlow,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onBrandGlass,
    borderWidth: 1,
    borderColor: colors.onBrandGlassBorder,
  },
  text: { flex: 1, gap: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  label: { flexShrink: 1 },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.onBrandGlass,
    borderWidth: 1,
    borderColor: colors.onBrandGlassBorder,
  },
  eta: {
    minWidth: 92,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.gutterSm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.onBrandGlass,
    borderWidth: 1,
    borderColor: colors.onBrandGlassBorder,
  },
  minutesRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
});
