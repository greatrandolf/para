import { StyleSheet } from 'react-native';

import { colors, elevation, radius, spacing, tiers } from '@/constants/theme';

const pill = {
  position: 'absolute',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  paddingHorizontal: spacing.gutterSm,
  paddingVertical: 6,
  borderRadius: radius.full,
} as const;

/** Floating white map overlay (DESIGN Level 2). */
const floating = {
  backgroundColor: colors.surfaceCard,
  borderWidth: 1,
  borderColor: colors.borderSubtle,
  boxShadow: elevation.level2,
} as const;

/** Light-blue info box inside a card. */
const infoBox = { borderRadius: radius.base, ...tiers.infoBox } as const;

export const styles = StyleSheet.create({
  root: { flex: 1, ...tiers.canvas },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  lock: { gap: spacing.sm, padding: spacing.sm },
  lockDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.live },
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.gutterSm,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  heat: { gap: spacing.gutterSm, padding: spacing.gutterSm },
  heatRow: { flexDirection: 'row', gap: spacing.sm },
  heatTile: {
    flex: 1,
    gap: 2,
    padding: spacing.sm + 2,
    borderRadius: radius.base,
    borderWidth: 1,
  },
  // Heatmap tile tones (plan): high = brand tint, approaching = amber tint, steady = live tint.
  heatHigh: { backgroundColor: colors.brandTint, borderColor: colors.brand },
  heatApproaching: { backgroundColor: colors.amberTint, borderColor: colors.amber },
  heatSteady: { backgroundColor: colors.liveTint, borderColor: colors.live },
  telemetry: { gap: spacing.gutterSm, padding: spacing.md },
  telemetryRow: { flexDirection: 'row', gap: spacing.gutterSm },
  telemetryTile: { flex: 1, gap: spacing.xs, padding: spacing.gutterSm, ...infoBox },
  metric: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  target: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.gutterSm,
    ...infoBox,
  },
  targetRight: { alignItems: 'flex-end' },
  views: { flexDirection: 'row', alignItems: 'center', gap: spacing.gutterSm, paddingVertical: spacing.gutterSm },
  viewsIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewsTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 96,
    padding: spacing.sm,
    ...tiers.tier1,
    borderRadius: radius.md,
  },
  actionFare: { backgroundColor: colors.amberTint, borderColor: colors.amber },
  /** SOS: `danger` (solid crimson with white text, 4.70:1). */
  actionDanger: { backgroundColor: colors.crimsonAlert, borderColor: colors.crimsonAlert },
  actionPressed: { transform: [{ scale: 0.98 }] },
});

export const RADAR_HEIGHT = 440;

export const mapStyles = StyleSheet.create({
  headway: { ...pill, ...floating, top: spacing.md, left: spacing.md },
  // DESIGN "Floating Controls": white circle, slate icon.
  recenter: { position: 'absolute', top: spacing.md, right: spacing.md, borderRadius: radius.full, ...floating },
  ahead: { ...pill, ...floating, top: 72, left: '28%', maxWidth: '50%' },
  aheadArrow: {
    position: 'absolute',
    top: 128,
    left: '47%',
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cluster: {
    position: 'absolute',
    top: 118,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutterSm,
    paddingVertical: spacing.sm,
    borderRadius: radius.base,
    // Bright orange callout with bold white text (W2).
    backgroundColor: colors.brandAction,
    boxShadow: elevation.glowBrand,
  },
  behindArrow: {
    position: 'absolute',
    top: 300,
    left: '47%',
    width: 22,
    height: 22,
    borderRadius: radius.full,
    ...floating,
    alignItems: 'center',
    justifyContent: 'center',
  },
  behind: { ...pill, ...floating, top: 330, left: '35%' },
  amberDot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.amber },
  greenDot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.live },
  flowDot: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.amber },
  capitol: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutterSm,
    paddingVertical: spacing.sm,
    borderRadius: radius.base,
    ...floating,
  },
  flow: { ...pill, ...floating, right: spacing.md, bottom: spacing.md + 6 },
});
