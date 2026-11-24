import { StyleSheet } from 'react-native';

import { typography } from '../theme';

export const variantStyles = StyleSheet.create(typography);

export const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  uppercase: { textTransform: 'uppercase' },
});
