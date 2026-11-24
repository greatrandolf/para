import { StyleSheet } from 'react-native';

import { colors, elevation, radius, spacing } from '../theme';

export const styles = StyleSheet.create({
  // Cycle-1 D4 nesting: the outer view owns the radius, border and the level-1 shadow
  // (light mode brings shadows back); the clip view clips the gradient to the radius.
  outer: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, boxShadow: elevation.level1 },
  clip: { borderRadius: radius.md, overflow: 'hidden' },
  base: { borderRadius: radius.md, padding: spacing.md },
});
