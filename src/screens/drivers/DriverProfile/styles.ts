import { StyleSheet } from 'react-native';

import { colors, radius, spacing, tiers } from '@/constants/theme';

const circle = {
  width: 40,
  height: 40,
  borderRadius: radius.full,
  alignItems: 'center',
  justifyContent: 'center',
} as const;
/** Light-blue info box inside a card. */
const infoBox = { borderRadius: radius.base, ...tiers.infoBox } as const;
/** White inner tile with a soft border. */
const whiteBox = {
  borderRadius: radius.base,
  backgroundColor: colors.surfaceCard,
  borderWidth: 1,
  borderColor: colors.borderSubtle,
} as const;

export const styles = StyleSheet.create({
  root: { flex: 1, ...tiers.canvas },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  card: { gap: spacing.gutterSm, padding: spacing.md + 4 },
  identity: { flex: 1, gap: 2 },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.amberTint,
    marginTop: spacing.xs,
  },
  // Certification chips wrap rather than clip with the v3 pill badges (AC42).
  certs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'flex-start' },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  unitBox: { gap: spacing.sm, padding: spacing.gutterSm, ...infoBox },
  alignEnd: { alignItems: 'flex-end' },
  routeTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  specRow: { flexDirection: 'row', gap: spacing.sm },
  spec: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.gutterSm,
    ...whiteBox,
  },
  // Profile checklist row: light-blue info box (reference image).
  checklist: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.gutterSm,
    ...infoBox,
  },
  autoSync: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  greenDot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.live },
  payout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gutterSm,
    padding: spacing.gutterSm,
    ...infoBox,
  },
  payoutLabel: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: spacing.sm, rowGap: 2 },
  shrink: { flexShrink: 1 },
  phoneIcon: { ...circle, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle },
  savingsIcon: { ...circle, backgroundColor: colors.amberTint },
  actions: { flexDirection: 'row', gap: spacing.sm },
  docs: { gap: spacing.sm },
  endShift: { marginTop: spacing.sm },
  version: { textAlign: 'center' },
  phoneHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  phoneActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
