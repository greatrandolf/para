import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '../Icon';
import { styles, variantIcon, variantStyles } from './styles';

export type IconButtonVariant = keyof typeof variantStyles;

export type IconButtonProps = {
  icon: IconName;
  /** Required: icon-only controls need a spoken label. */
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: IconButtonVariant;
  iconColor?: string;
  iconSize?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/** 48x48 icon control with the 8px base radius (DESIGN.md v3 touch targets). */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'tonal',
  iconColor,
  iconSize = 22,
  testID,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.base, variantStyles[variant], pressed && styles.pressed, style]}>
      <Icon name={icon} size={iconSize} color={iconColor ?? variantIcon[variant]} />
    </Pressable>
  );
}
