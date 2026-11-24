import { View, type DimensionValue } from 'react-native';

import { colors } from '../theme';
import { styles } from './styles';
import type { MapPosition } from './types';

export type RouteSegmentProps = MapPosition & {
  length: DimensionValue;
  orientation?: 'horizontal' | 'vertical';
  color?: string;
  thickness?: number;
  /** Tracked segment: adds the brand glow (DESIGN.md "selected route paths"). */
  glow?: boolean;
};

/** One straight piece of a route polyline. */
export function RouteSegment({
  x,
  y,
  length,
  orientation = 'horizontal',
  color = colors.live,
  thickness = 6,
  glow,
}: RouteSegmentProps) {
  const size = orientation === 'horizontal' ? { width: length, height: thickness } : { width: thickness, height: length };
  return <View style={[styles.segment, { left: x, top: y, backgroundColor: color }, glow && styles.segmentGlow, size]} />;
}
