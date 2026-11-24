import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../theme';

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    // DESIGN.md v3: badges, chips and route identifiers are full pills.
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  md: { paddingHorizontal: spacing.gutterSm, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: radius.full },
  label: { flexShrink: 1 },
});

/** DESIGN.md v3 badge tones (plan "Component rules (v3)", with the W2 user decision). */
export const toneStyles = StyleSheet.create({
  brand: { backgroundColor: colors.brandTint },
  /** Bright orange with bold white text (W2). */
  brandSolid: { backgroundColor: colors.brandAction },
  /** Route identifiers ("ROUTE 17B", "E-JEEP", "#04-C"): bright orange, bold white text (W2). */
  route: { backgroundColor: colors.brandAction, borderWidth: 1, borderColor: colors.brand },
  fare: { backgroundColor: colors.amberTint },
  fareSolid: { backgroundColor: colors.amber },
  live: { backgroundColor: colors.liveTint },
  liveSolid: { backgroundColor: colors.liveStrong },
  neutral: { backgroundColor: colors.surfaceContainerHigh },
  offline: { backgroundColor: colors.surfaceContainerHigh, borderWidth: 1, borderColor: colors.borderStrong },
  info: { backgroundColor: colors.surfaceContainer },
  error: { backgroundColor: colors.errorTint },
  /** Inside the teal and slate gradient cards. */
  glass: { backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder },
});

export const toneText = {
  brand: colors.brandStrong,
  brandSolid: colors.onBrandAction,
  route: colors.onBrandAction,
  fare: colors.amberStrong,
  fareSolid: colors.onAmber,
  live: colors.liveStrong,
  liveSolid: colors.onDark,
  neutral: colors.textMuted,
  offline: colors.textMuted,
  info: colors.secondary,
  error: colors.error,
  glass: colors.onDark,
} as const;

export const toneDot = {
  brand: colors.brand,
  brandSolid: colors.onBrandAction,
  route: colors.onBrandAction,
  fare: colors.amber,
  fareSolid: colors.onAmber,
  live: colors.live,
  liveSolid: colors.onDark,
  neutral: colors.textSubtle,
  offline: colors.textSubtle,
  info: colors.secondary,
  error: colors.crimsonAlert,
  glass: colors.tertiaryFixed,
} as const;

/** Tones whose label sits on a bright orange fill and must be bold (W2). */
export const BOLD_TONES: readonly (keyof typeof toneText)[] = ['route', 'brandSolid'];
