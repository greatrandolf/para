import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { colors, type TypographyVariant } from '../theme';
import { disabledStyles, glowStyles, pressedStyles, sizeStyles, styles, variantStyles, variantText } from './styles';

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  fullWidth?: boolean;
  /** `flex: 1` inside a row. */
  flex?: boolean;
  /** Override the label colour (a theme token). */
  color?: string;
  textVariant?: TypographyVariant;
  numberOfLines?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * DESIGN.md v3 button. Labels use the `labelAction` extension (Hanken
 * Grotesk 700, plan Q8); `sm` buttons use the same bold face at `bodySm`
 * size. The primary fill is bright `brandAction` with a bold white label (W2).
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  fullWidth,
  flex,
  color,
  textVariant,
  numberOfLines,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}: ButtonProps) {
  const glass = variant === 'glass';
  const textColor = disabled && !glass ? colors.textMuted : (color ?? variantText[variant]);
  const labelVariant: TypographyVariant = textVariant ?? (size === 'sm' ? 'bodySm' : 'labelAction');
  const iconSize = size === 'sm' ? 16 : 20;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      hitSlop={size === 'sm' ? 4 : undefined}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        variant === 'primary' && !disabled && glowStyles.primary,
        fullWidth && styles.fullWidth,
        flex && styles.flex,
        disabled && (glass ? disabledStyles.glass : disabledStyles.bg),
        pressed && !disabled && styles.pressed,
        pressed && !disabled && variant === 'primary' && pressedStyles.primary,
        style,
      ]}>
      {icon ? <Icon name={icon} size={iconSize} color={textColor} /> : null}
      <AppText
        variant={labelVariant}
        weight="bold"
        color={textColor}
        numberOfLines={numberOfLines}
        style={styles.label}>
        {label}
      </AppText>
      {iconRight ? <Icon name={iconRight} size={iconSize} color={textColor} /> : null}
    </Pressable>
  );
}
