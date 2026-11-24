import { StyleSheet } from 'react-native';

import { spacing } from '../theme';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, flexShrink: 1 },
  text: { flex: 1, flexShrink: 1 },
  right: { flexShrink: 0, alignItems: 'flex-end' },
});
