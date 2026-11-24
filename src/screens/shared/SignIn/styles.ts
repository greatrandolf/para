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
  brand: { alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.base,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  liveDot: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.live },
  tagline: { letterSpacing: 2 },
  form: { gap: spacing.md, padding: spacing.md + 4, ...tiers.tier1, borderRadius: radius.md },
  heading: { gap: spacing.xs },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.xs },
  error: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorTint,
  },
  shrink: { flexShrink: 1 },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.amberTint,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  driverRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  link: { textDecorationLine: 'underline' },
});
