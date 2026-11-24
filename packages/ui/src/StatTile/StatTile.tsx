import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { colors, type TypographyVariant } from '../theme';
import { styles } from './styles';

export type StatTileProps = {
  value: string;
  label?: string;
  caption?: string;
  captionColor?: string;
  icon?: IconName;
  iconColor?: string;
  iconBackground?: string;
  valueColor?: string;
  valueVariant?: TypographyVariant;
  align?: 'center' | 'start';
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function StatTile({
  value,
  label,
  caption,
  captionColor = colors.textMuted,
  icon,
  iconColor = colors.brand,
  iconBackground = colors.brandTint,
  valueColor,
  valueVariant = 'labelEta',
  align = 'center',
  testID,
  style,
}: StatTileProps) {
  const textAlign = align === 'center' ? 'center' : 'left';
  return (
    <View testID={testID} style={[styles.tile, align === 'start' && styles.start, style]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
          <Icon name={icon} size={18} color={iconColor} />
        </View>
      ) : null}
      {label ? (
        <AppText variant="labelBadge" color={colors.textMuted} uppercase align={textAlign} numberOfLines={1}>
          {label}
        </AppText>
      ) : null}
      <AppText variant={valueVariant} color={valueColor} tabular align={textAlign} numberOfLines={1}>
        {value}
      </AppText>
      {caption ? (
        <AppText variant="bodySm" color={captionColor} align={textAlign} numberOfLines={2}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}
