import { View } from 'react-native';

import { colors } from '@/constants/theme';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';

import { sheetStyles as styles } from './styles';

type Props = {
  routeCode: string;
  /** The route's name, e.g. "Cofta Mouldings Corporation ⇄ Legaspi St". */
  routeName: string;
  /** Where the commuter is going, e.g. "Going to Legaspi St". */
  directionLabel?: string;
  /** The next jeep's unit and plate (live-arrival-card), when one is heading to the commuter's stop. */
  unitCode?: string;
  plate?: string;
};

/** Route badge, the next jeep's unit and plate, and the route line under the arrival card (live-arrival-card). */
export function VehicleSummary({ routeCode, routeName, directionLabel, unitCode, plate }: Props) {
  return (
    <View style={styles.vehicle} testID="vehicle-summary">
      <View style={styles.vehicleRow}>
        <Badge label={`Route ${routeCode}`} tone="route" uppercase />
        {unitCode ? <Badge label={unitCode} tone="fare" /> : null}
        {plate ? (
          <AppText variant="headlineMd" weight="bold" numberOfLines={1} style={styles.plate} testID="vehicle-plate">
            {plate}
          </AppText>
        ) : null}
      </View>
      <AppText variant="bodySm" color={colors.textMuted} numberOfLines={2}>
        {`${routeCode}: ${routeName}${directionLabel ? ` • ${directionLabel}` : ''}`}
      </AppText>
    </View>
  );
}
