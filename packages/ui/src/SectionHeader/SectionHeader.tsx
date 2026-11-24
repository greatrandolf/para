import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { colors, type TypographyVariant } from '../theme';
import { styles } from './styles';

export type SectionHeaderProps = {
  title: string;
  icon?: IconName;
  iconColor?: string;
  subtitle?: string;
  /** Badge, action link or any trailing element. */
  right?: ReactNode;
  titleVariant?: TypographyVariant;
  titleColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({
  title,
  icon,
  iconColor = colors.brand,
  subtitle,
  right,
  titleVariant = 'headlineSm',
  titleColor,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.left}>
        {icon ? <Icon name={icon} size={22} color={iconColor} /> : null}
        <View style={styles.text}>
          <AppText variant={titleVariant} weight="bold" color={titleColor} accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="bodySm" color={colors.textMuted}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}
