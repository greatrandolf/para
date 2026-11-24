import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../theme';

export const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceCard,
  },
  boxFocused: { borderColor: colors.brand, borderWidth: 1.5 },
  boxError: { borderColor: colors.error },
  input: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 16, color: colors.onSurface },
  toggle: { paddingHorizontal: spacing.md, minHeight: 48, justifyContent: 'center' },
});
