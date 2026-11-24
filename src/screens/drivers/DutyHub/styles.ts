import { StyleSheet } from 'react-native';

import { colors, elevation, radius, spacing, tiers } from '@/constants/theme';
import { buttonHeightForLines } from '@packages/ui/Button';

const tile = {
  width: 40,
  height: 40,
  borderRadius: radius.base,
  alignItems: 'center',
  justifyContent: 'center',
} as const;

/** Light-blue info box inside a card (reference image). */
const infoBox = { padding: spacing.gutterSm, borderRadius: radius.base, ...tiers.infoBox } as const;

export const styles = StyleSheet.create({
  root: { flex: 1, ...tiers.canvas },
  // "ON DUTY | DRV-0042" chip (plan TopBar rule): light-blue pill, live dot, dark text.
  dutyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: spacing.sm,
    paddingRight: 3,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dutyDot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.live },
  dutyId: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  card: { gap: spacing.gutterSm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  // Badge rows wrap rather than clip with the wider v3 pill badges (AC42).
  rowWrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.gutterSm },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  profileName: { flex: 1, gap: 2 },
  innerBox: { gap: spacing.sm, ...infoBox },
  tileBrand: { ...tile, backgroundColor: colors.brandTint },
  tileLive: { ...tile, backgroundColor: colors.liveTint },
  tileAmber: { ...tile, backgroundColor: colors.amberTint },
  assignmentFacts: { gap: spacing.sm },
  factLabel: { width: 52 },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1 },
  qualified: { gap: spacing.sm, ...infoBox },
  poolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  poolLabel: { flex: 1 },
  formula: { ...infoBox },
  condition: { flexDirection: 'row', gap: spacing.sm, ...infoBox },
  earnings: { gap: spacing.sm },
  releaseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  /** Today by source and what is still to be paid (driver-pay-balance). */
  breakdown: { gap: spacing.sm },
  sources: { flexDirection: 'row', gap: spacing.xs },
  source: { flex: 1, gap: 2, ...infoBox },
  toPay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    ...infoBox,
  },
  toPayText: { flex: 1, gap: 2 },
  payout: { flexDirection: 'column', gap: 2, minWidth: 92 },
});

export const directionStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.gutterSm },
  headerText: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  detail: { gap: spacing.sm, ...infoBox },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  // DESIGN timeline: nodes joined by a 2px `borderStrong` line, wrapping at narrow widths.
  waypoints: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, rowGap: spacing.xs },
  stop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  node: { width: 8, height: 8, borderRadius: radius.full },
  nodeDone: { backgroundColor: colors.textSubtle },
  nodeNext: { backgroundColor: colors.live },
  nodeCurrentRing: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.pulseBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCurrent: { backgroundColor: colors.brand, boxShadow: elevation.glowBrand },
  line: { width: 12, height: 2, borderRadius: radius.full, backgroundColor: colors.borderStrong },
  current: { textDecorationLine: 'underline' },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  nextStop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1, minWidth: 180 },
  // Cycle-1 D5: the next stop wraps inside its row instead of running under the badge.
  nextStopText: { flexShrink: 1 },
});

export const broadcastStyles = StyleSheet.create({
  card: { gap: spacing.gutterSm },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  statusText: { flex: 1 },
  // Live dot on the teal card (`tertiaryFixed`, non-text 4.15:1).
  statusDot: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.tertiaryFixed },
  statusDotPaused: { backgroundColor: colors.onDarkMuted },
  // Glass outlines only: a translucent fill would lower `onDarkMuted` below 4.5:1 on teal.
  battery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  /** Cycle-1 D12: fits a two-line button, so "Reported!" (one line) does not shrink the card. */
  actions: { flexDirection: 'row', gap: spacing.sm, minHeight: buttonHeightForLines(2) },
});

export const miniMapStyles = StyleSheet.create({
  // Floating white overlay on the light map (DESIGN Level 2).
  overlay: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    boxShadow: elevation.level2,
  },
  overlayText: { flex: 1 },
});
