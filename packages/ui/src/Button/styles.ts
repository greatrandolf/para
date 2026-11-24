import { StyleSheet } from 'react-native';

import { colors, elevation, radius, spacing, typography } from '../theme';

/** Vertical padding of an `md` button. Exported so callers can derive stable heights. */
export const BUTTON_PADDING_Y = spacing.gutterSm;

/** Height of an `md` button whose label wraps to `lines` lines (label `labelAction`). */
export const buttonHeightForLines = (lines: number) => lines * typography.labelAction.lineHeight + 2 * BUTTON_PADDING_Y;

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    // Q13: the reference image draws rounded-rectangle buttons (8px base radius), not pills.
    borderRadius: radius.base,
    minHeight: 48,
  },
  fullWidth: { alignSelf: 'stretch' },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.98 }] },
  label: { textAlign: 'center', flexShrink: 1 },
});

export const sizeStyles = StyleSheet.create({
  // 40pt visual height; `hitSlop` in Button.tsx brings the target to 48.
  sm: { paddingHorizontal: spacing.gutterSm, paddingVertical: spacing.sm, minHeight: 40 },
  md: { paddingHorizontal: spacing.md, paddingVertical: BUTTON_PADDING_Y },
  lg: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56 },
});

/** DESIGN.md v3 button variants (plan "Component rules (v3)"). */
export const variantStyles = StyleSheet.create({
  /** Bright #FF5500 with a bold white label (W2 user decision). */
  primary: { backgroundColor: colors.brandAction },
  secondary: { backgroundColor: colors.surfaceCard, borderWidth: 1.5, borderColor: colors.brand },
  fare: { backgroundColor: colors.amber },
  tonal: { backgroundColor: colors.surfaceContainerHigh, borderWidth: 1, borderColor: colors.borderSubtle },
  'danger-soft': { backgroundColor: colors.errorTint },
  danger: { backgroundColor: colors.crimsonAlert },
  ghost: { backgroundColor: colors.transparent },
  /** Inside the teal and slate gradient cards. */
  glass: { backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder },
  /** Inside the bright `viewsAmber` gradient card. */
  'tonal-dark': { backgroundColor: colors.ink },
});

/** Label and icon colour per variant. Accent fills never carry accent-coloured text. */
export const variantText = {
  primary: colors.onBrandAction,
  secondary: colors.brandStrong,
  fare: colors.onAmber,
  tonal: colors.onSurface,
  'danger-soft': colors.error,
  danger: colors.onDark,
  ghost: colors.textMuted,
  glass: colors.onDark,
  'tonal-dark': colors.onDark,
} as const;

export const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.brandPressed },
});

/** The primary CTA glow (DESIGN `0 4px 14px` orange). Not applied when disabled. */
export const glowStyles = StyleSheet.create({
  primary: { boxShadow: elevation.ctaGlow },
});

export const disabledStyles = StyleSheet.create({
  bg: { backgroundColor: colors.surfaceContainerHigh, borderWidth: 1, borderColor: colors.borderSubtle },
  // On dark cards a disabled glass button stays glass, just dimmed.
  glass: { opacity: 0.55 },
});
