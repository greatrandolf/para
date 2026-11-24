import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../theme';

export const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingHorizontal: spacing.margin,
    paddingBottom: spacing.sm + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 48,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0 },
  // 32pt keeps "Para Live" (Space Grotesk 700, ~131pt) unclipped next to the
  // balance pill and avatar at 375pt.
  logo: {
    width: 32,
    height: 32,
    borderRadius: radius.base,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { flexShrink: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flexShrink: 1 },
  liveDot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.live },
  driverLine: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, flexShrink: 1 },
  driverChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 2 },
});
