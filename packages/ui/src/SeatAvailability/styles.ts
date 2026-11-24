import { StyleSheet } from 'react-native';

import { colors, radius, spacing, tiers } from '../theme';

/** Seat availability card (seat-availability): title, seats-left pill, a 4-part bar and the boarded count. */
export const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, ...tiers.infoBox },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.gutterSm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
  },
  bar: { flexDirection: 'row', gap: spacing.sm },
  segment: { flex: 1, height: 10, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHigh },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: spacing.sm },
});
