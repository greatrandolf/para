import { StyleSheet } from 'react-native';

import { colors, radius } from '../theme';

export const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    width: '100%',
    overflow: 'hidden',
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
  fill: { height: '100%' },
});

/**
 * DESIGN.md v3 progress tones. Fills are supplementary graphics (plan Q14):
 * every call site also shows its value as text and sets `accessibilityValue`.
 */
export const toneColors = {
  brand: colors.brand,
  live: colors.live,
  fare: colors.amber,
  neutral: colors.textSubtle,
} as const;
