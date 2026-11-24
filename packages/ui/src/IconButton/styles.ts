import { StyleSheet } from 'react-native';

import { colors, radius } from '../theme';

export const styles = StyleSheet.create({
  base: {
    // DESIGN.md minimum touch target (48x48) and the 8px base radius.
    width: 48,
    height: 48,
    borderRadius: radius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.95 }] },
});

/** Plan "IconButton tones" (v3). */
export const variantStyles = StyleSheet.create({
  /** Plan "IconButton tones": light-blue `surfaceContainerLow` with a slate icon. */
  tonal: { backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.borderSubtle },
  brand: { backgroundColor: colors.brandTint },
  live: { backgroundColor: colors.liveTint },
  /** Amber action. */
  fare: { backgroundColor: colors.amberTint },
  /** On photos and dark backdrops (the Para Ad viewer). */
  glass: { backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder },
});

export const variantIcon = {
  tonal: colors.ink,
  brand: colors.brand,
  live: colors.liveStrong,
  fare: colors.amberStrong,
  glass: colors.onDark,
} as const;
