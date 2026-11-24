import { View, type ColorValue } from 'react-native';

import { Icon, type IconName } from '../Icon';
import { colors } from '../theme';
import { styles } from './styles';

export type TabBarIconProps = {
  name: IconName;
  /** Tint from the tab navigator (a string for this app's theme). */
  color: ColorValue;
  focused: boolean;
  size?: number;
};

/**
 * Tab icon with the brand (#FF5500) indicator dot under the active icon.
 * The focused icon is painted `brand` (non-text, plan D3); the navigator's
 * active tint (`brandStrong`) is for the label only.
 */
export function TabBarIcon({ name, color, focused, size = 24 }: TabBarIconProps) {
  const tint = focused ? colors.brand : typeof color === 'string' ? color : undefined;
  return (
    <View style={styles.wrap}>
      <Icon name={name} size={size} color={tint} testID={focused ? 'tabbar-icon-focused' : undefined} />
      <View testID={focused ? 'tab-indicator-dot' : undefined} style={[styles.dot, !focused && styles.dotHidden]} />
    </View>
  );
}
