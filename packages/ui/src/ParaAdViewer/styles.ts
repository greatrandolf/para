import { StyleSheet } from 'react-native';

import { colors, spacing } from '../theme';

/** Full-screen photo viewer (para-ads): black backdrop, the photo fitted in the middle, controls on top and bottom. */
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.photoBackdrop },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  who: { flex: 1, gap: 2 },
  photoArea: { flex: 1, justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  bottom: { gap: spacing.md, paddingHorizontal: spacing.md, paddingTop: spacing.md },
});
