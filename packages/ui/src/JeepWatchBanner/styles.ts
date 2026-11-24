import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../theme';

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  watching: { backgroundColor: colors.brandTint, borderColor: colors.borderSubtle },
  coming: { backgroundColor: colors.liveTint, borderColor: colors.liveStrong },
  text: { flex: 1, gap: 2 },
  cancel: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.xs },
});
