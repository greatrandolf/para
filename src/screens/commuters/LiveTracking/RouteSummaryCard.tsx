import { View } from 'react-native';

import { colors } from '@/constants/theme';
import type { LiveTrip } from '@/types/commuter';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';

import { summaryStyles as styles } from './styles';

type Props = {
  trip: LiveTrip;
  /** Vehicles on the direction currently selected in the sheet. */
  vehiclesApproaching: number;
};

/** Route summary at the top of the live map: route code, name, vehicles approaching and ETA. */
export function RouteSummaryCard({ trip, vehiclesApproaching }: Props) {
  const code = trip.roadShield;
  const plural = vehiclesApproaching === 1 ? 'vehicle' : 'vehicles';
  return (
    <View style={styles.card} testID="route-summary">
      <View style={styles.code}>
        <AppText variant="labelEta" color={colors.onBrandAction}>
          {code}
        </AppText>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="headlineSm" weight="bold" numberOfLines={1}>
            {`Route ${code}`}
          </AppText>
          <Badge label="YOUR PREFERRED ROUTE" tone="info" size="sm" />
        </View>
        <AppText variant="bodySm" color={colors.textMuted}>
          {`${vehiclesApproaching} ${plural} approaching`}
        </AppText>
      </View>
      <View style={styles.eta}>
        <AppText variant="headlineSm" weight="bold" color={colors.brandStrong} tabular>
          {`${trip.eta.minutes} min`}
        </AppText>
        <AppText variant="labelBadge" color={colors.textMuted}>
          ETA
        </AppText>
        <AppText variant="labelBadge" color={colors.textMuted}>
          {trip.passTimeLeft}
        </AppText>
      </View>
    </View>
  );
}
