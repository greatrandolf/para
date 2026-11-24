import { View, type DimensionValue } from 'react-native';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { calloutText, calloutTones, styles } from './styles';
import type { MapPosition } from './types';

export type MapCalloutTone = keyof typeof calloutTones;

export type MapCalloutProps = MapPosition & {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  tone?: MapCalloutTone;
  maxWidth?: DimensionValue;
  /** Anchor from the right edge instead of `x`. */
  right?: DimensionValue;
  bold?: boolean;
};

export function MapCallout({
  x,
  y,
  right,
  title,
  subtitle,
  icon,
  iconColor,
  tone = 'tier2',
  maxWidth = '70%',
  bold = true,
}: MapCalloutProps) {
  const text = calloutText[tone];
  const position = right !== undefined ? { right, top: y } : { left: x, top: y };
  return (
    <View style={[styles.callout, calloutTones[tone], position, { maxWidth }]}>
      {icon ? <Icon name={icon} size={18} color={iconColor ?? text.title} /> : null}
      <View style={styles.calloutText}>
        <AppText variant="labelBadge" weight={bold ? 'bold' : 'semibold'} color={text.title} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySm" color={text.subtitle} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
