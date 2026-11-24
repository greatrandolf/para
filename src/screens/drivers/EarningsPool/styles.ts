import { StyleSheet } from 'react-native';

import { colors, radius, spacing, tiers } from '@/constants/theme';

const circle = {
  width: 40,
  height: 40,
  borderRadius: radius.full,
  alignItems: 'center',
  justifyContent: 'center',
} as const;
const tile = {
  width: 44,
  height: 44,
  borderRadius: radius.base,
  alignItems: 'center',
  justifyContent: 'center',
} as const;
/** Light-blue info box inside a card. */
const infoBox = { borderRadius: radius.base, ...tiers.infoBox } as const;

export const styles = StyleSheet.create({
  root: { flex: 1, ...tiers.canvas },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.gutterSm, paddingVertical: spacing.gutterSm },
  bannerIcon: { ...circle, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder },
  card: { gap: spacing.gutterSm, padding: spacing.lg - 4 },
  totalIcon: { ...circle, width: 48, height: 48, backgroundColor: colors.brandTint },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  release: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.gutterSm,
    ...infoBox,
  },
  centerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  box: { gap: spacing.sm, padding: spacing.md, ...infoBox },
  amberBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.base,
    backgroundColor: colors.amberTint,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  // "POOL REVENUE FORMULA" info box.
  formula: { gap: spacing.xs, padding: spacing.gutterSm, ...infoBox },
  chips: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  telemetry: { flexDirection: 'row', alignItems: 'center', gap: spacing.gutterSm },
  tilePrimary: { ...tile, backgroundColor: colors.brandTint },
  tileAmber: { ...tile, backgroundColor: colors.amberTint },
  tileLive: { ...tile, backgroundColor: colors.liveTint },
  monthCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.gutterSm },
  monthIcon: { ...circle, backgroundColor: colors.surfaceCard },
  entries: { gap: 0, paddingVertical: spacing.xs },
  entry: { flexDirection: 'row', alignItems: 'center', gap: spacing.gutterSm, paddingVertical: spacing.gutterSm },
  entryDivider: { borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  checkIcon: { ...circle, width: 32, height: 32, backgroundColor: colors.liveTint },
  trailing: { alignItems: 'flex-end', gap: spacing.xs },
  pendingIcon: { ...circle, width: 32, height: 32, backgroundColor: colors.amberTint },
  carriedIcon: { ...circle, width: 32, height: 32, backgroundColor: colors.surfaceContainerHigh },
  payout: { gap: spacing.xs, paddingBottom: spacing.xs },
  // Earnings by unit (driver-unit-earnings).
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gutterSm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  unitIcon: { ...circle, width: 32, height: 32, backgroundColor: colors.brandTint },
  unitBar: { gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  barTrack: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHigh, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: radius.full, backgroundColor: colors.brand },
  dayDetail: { gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  unitGroup: { gap: spacing.xs },
  entryLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 },
  entryTime: { width: 64 },
  payoutActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, paddingLeft: 44 },
  payoutEmpty: { gap: spacing.gutterSm, paddingVertical: spacing.gutterSm },
  payoutsLoading: { paddingVertical: spacing.gutterSm },
  footer: { alignItems: 'center', gap: spacing.sm },
});
