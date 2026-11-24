import { StyleSheet } from 'react-native';

import { colors, elevation, radius, spacing } from '../theme';

/** A floating white overlay (DESIGN Level 2). */
const floating = {
  backgroundColor: colors.surfaceCard,
  borderWidth: 1,
  borderColor: colors.borderSubtle,
  boxShadow: elevation.level2,
} as const;

export const styles = StyleSheet.create({
  // DESIGN.md v3 Level 0: light map ground.
  canvas: { width: '100%', overflow: 'hidden', backgroundColor: colors.mapLand },
  rounded: { borderRadius: radius.base, borderWidth: 1, borderColor: colors.borderSubtle },
  radar: { backgroundColor: colors.mapLand },
  water: {
    position: 'absolute',
    left: '-30%',
    width: '160%',
    height: 64,
    backgroundColor: colors.mapWater,
    transform: [{ rotate: '-14deg' }],
  },
  road: { position: 'absolute', backgroundColor: colors.mapRoad },
  roadMinor: { position: 'absolute', backgroundColor: colors.mapRoadMinor },
  radarRoad: { position: 'absolute', backgroundColor: colors.mapRoadMinor },
  absolute: { position: 'absolute' },
  // RouteSegment
  segment: { position: 'absolute', borderRadius: radius.sm },
  segmentGlow: { boxShadow: elevation.glowBrand },
  // MapPin: brand circles with a white ring, a white glyph and the brand glow.
  pinWrap: { position: 'absolute', alignItems: 'center' },
  vehiclePin: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: elevation.glowBrand,
  },
  selfRing: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.pulseBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfCore: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: elevation.glowBrand,
  },
  pinLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    ...floating,
  },
  /** "YOU" label: bright orange with a bold white label (W2). */
  pinLabelPrimary: { backgroundColor: colors.brandAction, borderColor: colors.brandAction },
  pinDot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.live },
  // MapCallout: floating overlay with the 8px base radius.
  callout: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutterSm,
    paddingVertical: spacing.sm,
    borderRadius: radius.base,
  },
  calloutText: { flexShrink: 1 },
  // PulseDot
  pulseRing: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pulseCore: { borderWidth: 3, borderColor: colors.surfaceCard, boxShadow: elevation.glowLive },
});

/** Callout tones. `tier2` is the default white overlay; `brand` is the tracked-object callout. */
export const calloutTones = StyleSheet.create({
  tier2: { ...floating },
  canvas: { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.borderStrong, boxShadow: elevation.level2 },
  /** Bright orange with bold white text (W2). */
  brand: { backgroundColor: colors.brandAction, boxShadow: elevation.level2 },
  live: { backgroundColor: colors.liveTint, borderWidth: 1, borderColor: colors.live, boxShadow: elevation.level2 },
});

export const calloutText = {
  tier2: { title: colors.onSurface, subtitle: colors.textMuted },
  canvas: { title: colors.onSurface, subtitle: colors.textMuted },
  brand: { title: colors.onBrandAction, subtitle: colors.onBrandAction },
  live: { title: colors.onSurface, subtitle: colors.textMuted },
} as const;
