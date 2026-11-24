import { StyleSheet } from 'react-native';

import { colors, radius, spacing, tiers } from '../theme';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gutterSm,
    padding: spacing.gutterSm,
    borderRadius: radius.base,
    // A light-blue info box inside its card.
    ...tiers.infoBox,
    minHeight: 56,
  },
  plain: { backgroundColor: colors.transparent, borderWidth: 0, paddingHorizontal: 0 },
  pressed: { backgroundColor: colors.surfaceContainer },
  tile: { width: 40, height: 40, borderRadius: radius.base, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, flexShrink: 1, gap: 2 },
  trailing: { flexShrink: 0, alignItems: 'flex-end' },
});
