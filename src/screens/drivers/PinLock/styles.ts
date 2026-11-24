import { StyleSheet } from 'react-native';

import { colors, radius, spacing, tiers } from '@/constants/theme';

const KEY_SIZE = 72;

export const styles = StyleSheet.create({
  root: { flex: 1, ...tiers.canvas },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.marginLg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  header: { alignItems: 'center', gap: spacing.sm, maxWidth: 360 },
  logo: {
    width: 60,
    height: 60,
    borderRadius: radius.base,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  dots: { flexDirection: 'row', gap: spacing.md },
  dot: { width: 16, height: 16, borderRadius: radius.full, borderWidth: 2, borderColor: colors.borderStrong },
  dotFilled: { backgroundColor: colors.brand, borderColor: colors.brand },
  messageRow: { minHeight: 22, justifyContent: 'center' },
  pad: {
    width: KEY_SIZE * 3 + spacing.lg * 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.lg,
    rowGap: spacing.md,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...tiers.tier1,
  },
  keyPressed: { backgroundColor: colors.brandTint, borderColor: colors.brand },
  keyBlank: { width: KEY_SIZE, height: KEY_SIZE },
});
