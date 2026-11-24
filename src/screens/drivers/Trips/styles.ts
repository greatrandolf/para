import { StyleSheet } from 'react-native';

import { tiers } from '@/constants/theme';

export const styles = StyleSheet.create({
  root: { flex: 1, ...tiers.canvas },
});
