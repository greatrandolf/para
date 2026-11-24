import { StyleSheet } from 'react-native';

import { colors, radius } from '../theme';

export const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', height: 30 },
  dot: {
    marginTop: 2,
    width: 4,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
  },
  dotHidden: { backgroundColor: colors.transparent },
});
