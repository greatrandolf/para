import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { gradients, type GradientName } from '../theme';
import { styles } from './styles';

export type GradientCardProps = {
  preset: GradientName;
  children?: ReactNode;
  /** Diagonal (default) or vertical. */
  direction?: 'diagonal' | 'vertical' | 'horizontal';
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const DIRECTIONS = {
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
} as const;

export function GradientCard({ preset, children, direction = 'diagonal', testID, style }: GradientCardProps) {
  const { start, end } = DIRECTIONS[direction];
  // iOS does not clip a LinearGradient to its own borderRadius (cycle-1 D4), so the border
  // sits on an outer View and an inner View clips the gradient to the rounded shape.
  return (
    <View testID={testID} style={styles.outer}>
      <View testID={testID ? `${testID}-clip` : undefined} style={styles.clip}>
        <LinearGradient
          colors={gradients[preset]}
          start={start}
          end={end}
          testID={testID ? `${testID}-gradient` : undefined}
          style={[styles.base, style]}>
          {children}
        </LinearGradient>
      </View>
    </View>
  );
}
