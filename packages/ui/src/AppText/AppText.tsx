import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, variantFamily, weightFamilies, type FontWeightName, type TypographyVariant } from '../theme';
import { styles, variantStyles } from './styles';

export type AppTextProps = TextProps & {
  /** DESIGN.md typography token. Defaults to `bodyMd`. */
  variant?: TypographyVariant;
  /** Text colour (pass a token from the theme). Defaults to `onSurface`. */
  color?: string;
  /** Swap to another weight of the variant's font family. */
  weight?: FontWeightName;
  /** Tabular figures for metrics, fares and ETAs. */
  tabular?: boolean;
  uppercase?: boolean;
  align?: TextStyle['textAlign'];
};

export function AppText({
  variant = 'bodyMd',
  color = colors.onSurface,
  weight,
  tabular,
  uppercase,
  align,
  style,
  ...rest
}: AppTextProps) {
  const override: TextStyle = {
    color,
    ...(weight ? { fontFamily: weightFamilies[variantFamily[variant]][weight] } : null),
    ...(align ? { textAlign: align } : null),
  };
  return (
    <Text
      {...rest}
      style={[variantStyles[variant], override, tabular && styles.tabular, uppercase && styles.uppercase, style]}
    />
  );
}
