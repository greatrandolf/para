import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { paddingStyles, styles } from './styles';

export type CardVariant = 'elevated' | 'tinted' | 'sheet' | 'dashed' | 'fare';

export type CardProps = {
  children?: ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof paddingStyles;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, variant = 'elevated', padding = 'md', testID, style }: CardProps) {
  return (
    <View testID={testID} style={[styles.base, styles[variant], paddingStyles[padding], style]}>
      {children}
    </View>
  );
}
