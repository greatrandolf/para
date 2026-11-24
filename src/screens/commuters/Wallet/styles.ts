import { StyleSheet } from 'react-native';

import { colors, radius, spacing, tiers } from '@/constants/theme';

export const styles = StyleSheet.create({
  root: { flex: 1, ...tiers.canvas },
  // Green notice (BSP-regulated gateways): live tint framed by the live accent.
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.liveTint,
    borderColor: colors.live,
  },
  noticeText: { flex: 1 },
  credits: { gap: spacing.gutterSm, padding: spacing.lg - 4 },
  creditsTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  creditsLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  // White inner box on the orange-tint credits gradient.
  creditsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.gutterSm,
    borderRadius: radius.base,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  creditsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  flex: { flex: 1 },
  channelLabel: { marginBottom: -spacing.sm },
  ledgerList: { gap: spacing.gutterSm },
  guarantee: { flexDirection: 'row', alignItems: 'center', gap: spacing.gutterSm },
  guaranteeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.liveStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeBody: { flex: 1, gap: 2 },
});

export const gridStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.gutterSm },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2,
    padding: spacing.md,
    paddingTop: spacing.md + 2,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  // Selectable card rule (v3): selected = brand border + brand tint.
  tileSelected: { backgroundColor: colors.brandTint, borderColor: colors.brand },
  tag: { position: 'absolute', top: -10, right: spacing.sm },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
});

export const channelStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.gutterSm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  tileSelected: { backgroundColor: colors.brandTint, borderColor: colors.brand },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const ledgerStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.gutterSm },
  icon: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  iconView: { backgroundColor: colors.brandTint },
  iconCash: { backgroundColor: colors.liveTint },
  iconZero: { backgroundColor: colors.surfaceContainer },
  body: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: radius.full },
  trailing: { alignItems: 'flex-end', gap: 2, maxWidth: '34%' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
});
