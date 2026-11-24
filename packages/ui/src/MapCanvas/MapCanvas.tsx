import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { gradients } from '../theme';
import { styles } from './styles';

export type MapCanvasProps = {
  height: number;
  /** `street`: light land, river band and road grid. `radar`: `radarMap` gradient with a faint grid. */
  variant?: 'street' | 'radar';
  rounded?: boolean;
  children?: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const STREET_ROADS: { major: boolean; style: ViewStyle }[] = [
  { major: true, style: { left: 0, right: 0, top: '58%', height: 8 } },
  { major: true, style: { top: 0, bottom: 0, left: '40%', width: 8 } },
  { major: true, style: { top: 0, bottom: 0, left: '68%', width: 6 } },
  { major: false, style: { left: 0, right: 0, top: '80%', height: 4 } },
  { major: false, style: { left: 0, right: 0, top: '18%', height: 4 } },
  { major: false, style: { top: 0, bottom: 0, left: '14%', width: 4 } },
  { major: false, style: { top: 0, bottom: 0, left: '88%', width: 4 } },
];

const RADAR_ROADS: ViewStyle[] = [
  { left: 0, right: 0, top: '33%', height: 2 },
  { left: 0, right: 0, top: '66%', height: 2 },
  { top: 0, bottom: 0, left: '33%', width: 2 },
  { top: 0, bottom: 0, left: '50%', width: 6 },
  { top: 0, bottom: 0, left: '66%', width: 2 },
];

/**
 * Stylised map built from Views (plan D4): no native map, no location
 * permission, deterministic for screenshots. Children are absolutely
 * positioned overlays (`RouteSegment`, `MapPin`, `MapCallout`, `PulseDot`).
 */
export function MapCanvas({
  height,
  variant = 'street',
  rounded,
  children,
  accessibilityLabel,
  testID,
  style,
}: MapCanvasProps) {
  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[styles.canvas, variant === 'radar' && styles.radar, rounded && styles.rounded, { height }, style]}>
      {variant === 'radar' ? (
        <>
          <LinearGradient colors={gradients.radarMap} style={StyleSheet.absoluteFill} />
          {RADAR_ROADS.map((road, i) => (
            <View key={i} style={[styles.radarRoad, road]} />
          ))}
        </>
      ) : (
        <>
          <View style={[styles.water, { top: height * 0.12 }]} />
          {STREET_ROADS.map((road, i) => (
            <View key={i} style={[road.major ? styles.road : styles.roadMinor, road.style]} />
          ))}
        </>
      )}
      {children}
    </View>
  );
}
