import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../theme';

export const styles = StyleSheet.create({
  // DESIGN.md v3: amber tint pill with amber-strong mono text, full radius.
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.gutterSm,
    minHeight: 36,
    borderRadius: radius.full,
    backgroundColor: colors.amberTint,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  compact: {
    minHeight: 24,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  pressed: { backgroundColor: colors.surfaceContainerHighest },
});
