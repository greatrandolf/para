import { StyleSheet } from 'react-native';

import { colors, elevation, radius, spacing, tiers } from '@/constants/theme';

export const styles = StyleSheet.create({
  root: { flex: 1, ...tiers.canvas },
  /** Map plus the route sheet over it (live-map-bottom-sheet). */
  mapArea: { flex: 1 },
  content: { gap: 0, paddingTop: spacing.sm },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingRight: spacing.sm,
  },
  // Two mono lines ("Commute" / "Hub"), as in the design.
  backText: { width: 64 },
  divider: { width: 1, height: 32, backgroundColor: colors.borderSubtle },
  titleBlock: { flex: 1, flexShrink: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flexShrink: 1 },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.live,
  },
  routeCard: { gap: spacing.gutterSm, marginBottom: spacing.md },
  routeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  corridorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.base,
    backgroundColor: colors.brandTint,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  corridorLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  shrink: { flexShrink: 1 },
  // Both mono notes are ~190pt, so they stack instead of overflowing the card.
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: spacing.sm,
    rowGap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});

export const panelStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  panel: {
    flex: 1,
    gap: 6,
    padding: spacing.sm,
    borderRadius: radius.base,
  },
  /** Reference "To Apas": light-blue info panel. */
  panelIdle: { ...tiers.infoBox },
  /** Reference "To Colon" (tracked): orange-tinted panel with a brand border. */
  panelActive: {
    backgroundColor: colors.brandTint,
    borderColor: colors.brand,
    borderWidth: 1.5,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerLabel: { flex: 1 },
  // Cycle-1 D1: the row wraps so the ETA drops below before "Unit 23" is cut.
  unit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceCard,
  },
  /** Tracked unit: bright orange with a bold white label (W2). */
  unitTracked: { backgroundColor: colors.brandAction },
  unitName: { flexShrink: 1 },
});

export const MAP_HEIGHT = 440;

export const mapStyles = StyleSheet.create({
  bleed: { marginHorizontal: -spacing.margin },
  /** The map filling the screen under the route sheet (live-map-bottom-sheet). */
  fill: { flex: 1 },
  // Route identifier: white pill with an orange outline and orange text (reference "17B").
  routeBadge: {
    position: 'absolute',
    top: 72,
    left: '66%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  // Stop label: small grey dot before the place name.
  stop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.mapLabel,
    borderWidth: 2,
    borderColor: colors.surfaceCard,
  },
  // Jeep label: plate pill above the bus slot; the note pill sits to the right of the bus.
  // Fixed sizes keep the marker anchor (bus centre) exact; see TRACKED_LABEL in CorridorMap.
  trackedLabelBox: { width: 260, height: 84 },
  labelBox: { width: 96, height: 84 },
  // Empty slot under the plate where the bus is drawn by its own marker.
  busSpacer: { width: 1, height: 56 },
  busColumn: { width: 96, height: 84, alignItems: 'center', gap: 4 },
  plate: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    boxShadow: elevation.level1,
  },
  plateDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
  },
  // Top-down jeep (front to the right). Parts sit inside a 56pt box centred on the coordinate.
  jeepGlow: { width: 56, height: 56, borderRadius: radius.full },
  // Orange halo for jeeps heading to Colon.
  jeepGlowColon: { backgroundColor: colors.pulseBrand },
  jeepOutline: {
    position: 'absolute',
    left: 6,
    top: 17,
    width: 44,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.ink,
  },
  jeepBody: {
    position: 'absolute',
    left: 8,
    top: 19,
    width: 40,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.surfaceCard,
  },
  jeepWindshield: {
    position: 'absolute',
    left: 12,
    top: 22,
    width: 24,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.mapWater,
  },
  jeepCap: {
    position: 'absolute',
    left: 38,
    top: 20,
    width: 8,
    height: 16,
    borderRadius: 3,
    backgroundColor: colors.brand,
  },
  // Gray for jeeps heading to Apas: gray body and cap.
  jeepBodyApas: { backgroundColor: colors.borderStrong },
  jeepCapApas: { backgroundColor: colors.secondary },
  noteBox: {
    position: 'absolute',
    left: 102,
    top: 43,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    boxShadow: elevation.level1,
  },
  // Northbound: the note moves up with the bus, which now sits higher in its box.
  noteBoxNorthbound: { top: 14 },
  noteDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
  },
  // Route stops from the database: small dots on the lane.
  routeStop: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 2,
    borderColor: colors.brand,
  },
  routeStopInbound: { borderColor: colors.secondary },
  // Shown instead of the map when the build cannot draw one.
  mapUnavailable: {
    height: MAP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.margin * 2,
    backgroundColor: colors.surfaceContainerHigh,
  },
  mapUnavailableText: { textAlign: 'center' },
  // The stop the waiting commuter should walk to.
  boardStop: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: colors.surfaceCard,
  },
  // "3 jeeps live on Route 17B" over the map.
  liveStatus: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.margin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  // "Allow location to find your nearest stop", under the live status.
  locationHint: {
    position: 'absolute',
    top: spacing.sm + 36,
    left: spacing.margin,
    right: spacing.margin + 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.amberTint,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minHeight: 32,
  },
  // Lower when the waiting-pin pill sits under the live status.
  locationHintLow: { top: spacing.sm + 76 },
  // waiting-pin: "Set waiting pin" / "Waiting pin • 350 m from you ✕", under the live status.
  pinPill: {
    position: 'absolute',
    top: spacing.sm + 38,
    left: spacing.margin,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  // The pin: an orange head with a stem whose tip is the waiting spot, the boarding card beside it.
  pinBox: {
    width: 240,
    height: 48,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pinHead: { width: 56, alignItems: 'center' },
  pinIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: elevation.level2,
  },
  pinPillMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  // While placing: the pin steady with its tip on the middle of the map.
  placingPin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -17,
    marginTop: -48,
    alignItems: 'center',
  },
  placingCard: {
    position: 'absolute',
    top: spacing.sm + 38,
    left: spacing.margin,
    right: spacing.margin,
    gap: 2,
    padding: spacing.sm,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.brand,
    boxShadow: elevation.level2,
  },
  placingActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  // Going to / Going back under Wait here while placing.
  placingDirections: { marginTop: spacing.sm },
  pinStem: { width: 3, height: 14, backgroundColor: colors.brand, borderRadius: 2 },
  pinCard: { marginLeft: -8 },
  // The commuter's own location while a pin is set.
  meDot: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    borderWidth: 3,
    borderColor: colors.surfaceCard,
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.live,
  },
  liveStatusDotIdle: { backgroundColor: colors.textMuted },
  pickupCard: {
    flex: 1,
    gap: 2,
    marginLeft: -4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceCard,
    boxShadow: elevation.level2,
  },
  you: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: colors.surfaceCard,
  },
  safety: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  // Revision 13: where the commuter is going ("Going to Sto. Niño ⇅"), bottom left of the map; tap to switch.
  directionToggle: {
    position: 'absolute',
    left: spacing.margin,
    maxWidth: '75%',
    bottom: spacing.xl + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 2,
    borderColor: colors.brand,
    boxShadow: elevation.level2,
  },
  directionDot: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.brand },
  shrink: { flexShrink: 1 },
  // DESIGN "Floating Controls": white circle, slate icon, soft border, level-2 shadow.
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl + spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    boxShadow: elevation.level2,
  },
});

/**
 * Live Map route sheet (live-map-bottom-sheet): the map is the main view; the routes are a draggable sheet over it
 * (`@packages/ui/BottomSheet`). It starts minimized; pulling it up shows the routes.
 */
/**
 * Minimized with a pass: the handle, "Routes on your way" and the route list, so the commuter can focus on the map.
 * They pull it up for the seats and the jeeps.
 */
export const PAID_SHEET_COLLAPSED = 158;
/** Minimized without a pass: the same, above the floating pay button. */
export const FREE_SHEET_COLLAPSED = 250;
/** The sheet's handle (8 + 4 + 4) and the content's top padding: what sits above the route list. */
const SHEET_ABOVE_ROUTES = spacing.sm + 4 + spacing.xs + spacing.xs;

/**
 * The minimized sheet's height, from sizes measured on the phone: it stops just under the route list ("Routes on your
 * way" and the route buttons), and without a pass also clears the floating pay button. So it fits any screen and text
 * size. Until measured, the fixed heights above.
 */
export function minimizedSheetHeight(paid: boolean, routesHeight: number, payBarHeight: number, adLinkRoom = 0) {
  if (!routesHeight) return paid ? PAID_SHEET_COLLAPSED : FREE_SHEET_COLLAPSED + adLinkRoom;
  const routes = SHEET_ABOVE_ROUTES + routesHeight + spacing.sm;
  // The pay bar floats spacing.md above the sheet's bottom.
  return paid
    ? routes
    : routes + (payBarHeight ? payBarHeight + spacing.md : FREE_SHEET_COLLAPSED - PAID_SHEET_COLLAPSED);
}
/** Extra room when the floating bar also has the "Top up ₱1 • no ads" link under Watch Ad. */
export const AD_LINK_ROOM = 44;
/** With a pass: the route cards, dragged up over most of the map. */
export const PAID_SHEET_SNAP_POINTS: (number | `${number}%`)[] = [PAID_SHEET_COLLAPSED, '85%'];
/** Without a pass: the route chips (and a jeep watch banner), which need less room. */
export const FREE_SHEET_SNAP_POINTS: (number | `${number}%`)[] = [FREE_SHEET_COLLAPSED, '60%'];

/** The jeeps on the selected route, under its card (route-units). */
export const unitStyles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginTop: -spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.xs },
  headerText: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.gutterSm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  rowTracked: { backgroundColor: colors.brandAction },
  rowText: { flex: 1, gap: 2 },
});

/** Sections inside the route sheet. */
export const sheetStyles = StyleSheet.create({
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gpsText: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: spacing.xs,
  },
  /** Route, unit and plate under the arrival card (live-arrival-card). */
  vehicle: { gap: spacing.xs },
  vehicleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  plate: { flexShrink: 1 },
  /** The paid sections, spaced like the sheet. */
  sections: { gap: spacing.md, backgroundColor: colors.surfaceCard },
  pass: { flexDirection: 'row', alignItems: 'center', gap: spacing.gutterSm },
  passIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.base,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBody: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm },
});

/**
 * Live Map route options (revision 4, `stitch/live-tracking-route-options.png`).
 * Cards keep the same outer size selected or not: the 1 px idle border gets 1 px extra padding.
 */
const OPTION_PADDING = spacing.gutterSm - 2;

export const optionStyles = StyleSheet.create({
  /** A card and, for the selected route, its jeeps (route-units). */
  item: { gap: spacing.sm },
  list: { gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  cardIdle: {
    padding: OPTION_PADDING + 1,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardSelected: {
    padding: OPTION_PADDING,
    backgroundColor: colors.brandTint,
    borderWidth: 2,
    borderColor: colors.brand,
  },
  // Route-code tile: rounded 8 px square with a mono bold code.
  tile: {
    minWidth: 44,
    height: 32,
    paddingHorizontal: 6,
    borderRadius: radius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Bright orange with a bold white code (W2). */
  tileBest: { backgroundColor: colors.brandAction },
  tileAlternative: { backgroundColor: colors.ink },
  tilePreferred: { backgroundColor: colors.preferred },
  body: { flex: 1, minWidth: 0, gap: 2 },
  // The name and badge wrap onto two lines at 375 pt instead of truncating.
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: spacing.xs + 2,
    rowGap: 2,
  },
  name: { flexShrink: 1 },
  badge: {
    flexShrink: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeLabel: { flexShrink: 1 },
  /** Bright orange with a bold white label (W2). */
  badgeBest: { backgroundColor: colors.brandAction },
  /** Neutral grey pill. */
  badgeAlternative: {
    backgroundColor: colors.surfaceBg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  /** Light-blue pill with blue text. */
  badgePreferred: {
    backgroundColor: colors.preferredTint,
    borderWidth: 1,
    borderColor: colors.preferredBorder,
  },
  // Fixed minimum width so "18 min" never squeezes the body.
  eta: { minWidth: 72, flexShrink: 0, alignItems: 'flex-end', gap: 2 },
});

/** Route summary card above the map (reference: route list card, selected state). */
export const summaryStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.brandTint,
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  code: {
    width: 56,
    height: 48,
    borderRadius: radius.base,
    backgroundColor: colors.brandAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  eta: { alignItems: 'flex-end', gap: 2 },
});

/** Revision 11: the free view — routes on the way as orange code chips, and the floating ₱1 button. */
export const chipStyles = StyleSheet.create({
  /** Inside the route sheet, which gives the white card and padding (live-map-bottom-sheet). */
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minWidth: 64,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandTint,
    borderWidth: 2,
    borderColor: colors.brand,
  },
  /** Selected: bright orange with a bold white code (W2). */
  chipSelected: {
    backgroundColor: colors.brandAction,
    borderColor: colors.brandAction,
  },
  /** Space under the chips so the floating button never covers them. */
  /** What the minimized sheet shows without a pass: a jeep watch banner, if any, and the route list. */
  minimized: { gap: spacing.md },
  spacer: { height: 88 },
  /** With the top-up link under Watch Ad (AD_LINK_ROOM taller). */
  spacerAd: { height: 132 },
  payBar: {
    position: 'absolute',
    left: spacing.margin,
    right: spacing.margin,
    bottom: spacing.md,
    gap: spacing.xs,
  },
  /** "Top up ₱1 • no ads" under the Watch Ad button (ad-supported-live-view). */
  payLink: {
    alignSelf: 'center',
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
  },
});

/** direction-switch: "Going to" / "Going back" under the route chips. */
export const directionSwitchStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutterSm,
    paddingVertical: spacing.xs,
    borderRadius: radius.base,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceCard,
  },
  optionOn: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  dot: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.borderStrong },
  dotOn: { backgroundColor: colors.brand },
  label: { flex: 1 },
});
