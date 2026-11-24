import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { colors } from '../theme';
import { styles } from './styles';

/**
 * ICON_MAP: the Stitch designs use Material Symbols names in snake_case
 * (e.g. `lock_clock`). Every glyph used by these screens exists in the
 * `@expo/vector-icons` MaterialIcons set under the kebab-case name
 * (`lock-clock`), including `shield-moon`, `emergency-share`,
 * `broadcast-on-home`, `flood`, `swap-calls`, `electric-bolt` and
 * `signal-cellular-nodata`, so no substitutions were needed.
 * `family="community"` is available for MaterialCommunityIcons glyphs.
 */
export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
export type CommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export type IconName = MaterialIconName;
export type IconColor = ComponentProps<typeof MaterialIcons>['color'];

type BaseProps = {
  size?: number;
  color?: IconColor;
  style?: StyleProp<TextStyle>;
  testID?: string;
};

export type IconProps = BaseProps &
  ({ family?: 'material'; name: MaterialIconName } | { family: 'community'; name: CommunityIconName });

export function Icon({ size = 20, color = colors.onSurface, style, testID, ...glyph }: IconProps) {
  const common = {
    size,
    color,
    style: [styles.icon, style],
    testID,
    accessible: false,
    importantForAccessibility: 'no' as const,
  };
  if (glyph.family === 'community') return <MaterialCommunityIcons name={glyph.name} {...common} />;
  return <MaterialIcons name={glyph.name} {...common} />;
}
