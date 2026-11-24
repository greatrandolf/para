import { StyleSheet } from 'react-native';

import { colors, radius } from '../theme';

export const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  // Plan Q11: avatars stay circular (people, not containers) with a 1px ring.
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  verified: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.liveStrong,
    borderWidth: 2,
    borderColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const toneStyles = StyleSheet.create({
  brand: { backgroundColor: colors.brandTint },
  fare: { backgroundColor: colors.amberTint },
  neutral: { backgroundColor: colors.surfaceContainer },
  live: { backgroundColor: colors.liveTint },
});

/** Initials colour per tone (all reach AA on their fill, see contrast.ts). */
export const toneText = {
  brand: colors.brandStrong,
  fare: colors.amberStrong,
  neutral: colors.onSurface,
  live: colors.liveStrong,
} as const;
