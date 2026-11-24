import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { BOLD_TONES, styles, toneDot, toneStyles, toneText } from './styles';

export type BadgeTone = keyof typeof toneStyles;

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  /** Inset 6px status circle (DESIGN.md telemetry badges). */
  dot?: boolean;
  icon?: IconName;
  size?: 'sm' | 'md';
  uppercase?: boolean;
  numberOfLines?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/** Full-pill badge with JetBrains Mono `labelBadge` text (DESIGN.md v3). */
export function Badge({
  label,
  tone = 'brand',
  dot,
  icon,
  size = 'sm',
  uppercase,
  numberOfLines = 1,
  testID,
  style,
}: BadgeProps) {
  const color = toneText[tone];
  return (
    <View testID={testID} style={[styles.base, size === 'md' && styles.md, toneStyles[tone], style]}>
      {dot ? <View testID={testID ? `${testID}-dot` : undefined} style={[styles.dot, { backgroundColor: toneDot[tone] }]} /> : null}
      {icon ? <Icon name={icon} size={size === 'md' ? 14 : 12} color={color} /> : null}
      <AppText
        variant="labelBadge"
        weight={BOLD_TONES.includes(tone) ? 'bold' : 'semibold'}
        color={color}
        uppercase={uppercase}
        numberOfLines={numberOfLines}
        style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}
