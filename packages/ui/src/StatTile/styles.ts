import { StyleSheet } from 'react-native';

import { radius, spacing, tiers } from '../theme';

export const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...tiers.tier1,
    borderRadius: radius.base,
  },
  start: { alignItems: 'flex-start' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
