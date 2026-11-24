import { View } from 'react-native';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { colors } from '../theme';
import { styles } from './styles';
import type { MapPosition } from './types';

export type MapPinProps = MapPosition & {
  label?: string;
  /** `vehicle`: brand live-vehicle marker. `self`: brand marker with pulse ring (driver position). */
  variant?: 'vehicle' | 'self';
  icon?: IconName;
  /** Green live status dot before the label. */
  live?: boolean;
};

export function MapPin({ x, y, label, variant = 'vehicle', icon = 'directions-bus', live }: MapPinProps) {
  const isSelf = variant === 'self';
  return (
    <View style={[styles.pinWrap, { left: x, top: y }]} accessible accessibilityLabel={label ? `Vehicle ${label}` : 'Vehicle'}>
      {isSelf ? (
        <View style={styles.selfRing}>
          <View style={styles.selfCore}>
            <Icon name={icon} size={18} color={colors.onBrand} />
          </View>
        </View>
      ) : (
        <View style={styles.vehiclePin}>
          <Icon name={icon} size={16} color={colors.onBrand} />
        </View>
      )}
      {label ? (
        <View style={[styles.pinLabel, isSelf && styles.pinLabelPrimary]}>
          {live ? <View style={styles.pinDot} /> : null}
          <AppText variant="labelBadge" weight="bold" color={isSelf ? colors.onBrandAction : colors.onSurface} numberOfLines={1}>
            {label}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
