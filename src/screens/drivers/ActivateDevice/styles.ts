import { StyleSheet } from 'react-native';

import { colors, radius, spacing, tiers } from '@/constants/theme';

export const styles = StyleSheet.create({
  root: { flex: 1, ...tiers.canvas },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.marginLg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  header: { alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.base,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  shrink: { flexShrink: 1 },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.amberTint,
  },
  error: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorTint,
  },
  busy: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  actions: { gap: spacing.md },
  cameraWrap: { gap: spacing.md },
  camera: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden' },
  reticle: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '70%',
    aspectRatio: 1,
    borderWidth: 3,
    borderColor: colors.onDark,
    borderRadius: radius.lg,
  },
  paste: { gap: spacing.sm, padding: spacing.md, ...tiers.tier1, borderRadius: radius.md },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceCard,
    color: colors.onSurface,
    fontSize: 15,
  },
});
