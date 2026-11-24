import { StyleSheet } from 'react-native';

import { colors, radius, spacing, tiers } from '../theme';

export const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    ...tiers.tier1,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.base,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  // Cycle-1 D9: the Badge default `alignSelf: 'flex-start'` must not win here.
  badge: { alignSelf: 'center' },
  action: { marginTop: spacing.md, alignSelf: 'stretch' },
});
