import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { colors } from '../theme';
import { styles } from './styles';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  icon?: IconName;
  iconColor?: string;
  iconBackground?: string;
  /** Trailing content (amount, badge, switch, button). */
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  /** No background or horizontal padding. */
  plain?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function ListRow({
  title,
  subtitle,
  subtitleColor = colors.textMuted,
  icon,
  iconColor = colors.brand,
  iconBackground = colors.brandTint,
  trailing,
  chevron,
  onPress,
  plain,
  accessibilityLabel,
  testID,
  style,
}: ListRowProps) {
  const content = (
    <>
      {icon ? (
        <View style={[styles.tile, { backgroundColor: iconBackground }]}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>
      ) : null}
      <View style={styles.body}>
        <AppText variant="bodyMd" weight="semibold" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySm" color={subtitleColor} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      {chevron ? <Icon name="chevron-right" size={22} color={colors.textMuted} /> : null}
    </>
  );
  if (!onPress) {
    return (
      <View testID={testID} style={[styles.row, plain && styles.plain, style]}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.row, plain && styles.plain, pressed && styles.pressed, style]}>
      {content}
    </Pressable>
  );
}
