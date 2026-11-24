import { View } from 'react-native';

import { colors } from '../theme';
import { styles } from './styles';
import type { MapPosition } from './types';

export type PulseDotProps = MapPosition & {
  size?: number;
  color?: string;
  ringColor?: string;
  accessibilityLabel?: string;
};

/** Static concentric pulse ring: the `liveStrong` user dot with its `liveTint` accuracy ring by default. */
export function PulseDot({
  x,
  y,
  size = 18,
  color = colors.liveStrong,
  ringColor = colors.liveTint,
  accessibilityLabel,
}: PulseDotProps) {
  const ring = size * 2;
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={[styles.pulseRing, { left: x, top: y, width: ring, height: ring, borderRadius: ring / 2, backgroundColor: ringColor }]}>
      <View style={[styles.pulseCore, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />
    </View>
  );
}
