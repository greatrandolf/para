import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceCard,
  },
  pressed: { backgroundColor: colors.surfaceContainerLow },
});
