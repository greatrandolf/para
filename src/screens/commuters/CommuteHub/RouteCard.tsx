import { View } from 'react-native';

import { colors } from '@/constants/theme';
import type { TransitRoute, VehicleStyle } from '@/types/commuter';
import { formatPeso } from '@/utils/currency';
import { AppText } from '@packages/ui/AppText';
import { Badge, type BadgeTone } from '@packages/ui/Badge';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';

import { routeCardStyles as styles } from './styles';

const VEHICLE_TONE: Record<VehicleStyle, BadgeTone> = {
  mixedJeepney: 'brand',
  cityBus: 'info',
  modernJeepney: 'live',
  traditionalJeepney: 'neutral',
};

type Props = {
  route: TransitRoute;
  onViewLive: (route: TransitRoute) => void;
  /** Minutes left on a ₱1 live pass for this route, when one is running. */
  minutesLeft?: number;
};

export function RouteCard({ route, onViewLive, minutesLeft }: Props) {
  const paid = minutesLeft !== undefined;
  const offline = route.status === 'offline';
  return (
    <Card variant={offline ? 'dashed' : 'elevated'} testID={`route-card-${route.code}`} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.tags}>
          <Badge label={route.vehicleLabel} icon={route.vehicleIcon} tone={VEHICLE_TONE[route.vehicleStyle]} />
          <Badge label={`Route #${route.code}`} tone="route" />
        </View>
        {offline ? (
          <Badge label="0 on road (Offline)" icon="signal-cellular-nodata" tone="offline" />
        ) : (
          <Badge label={`${route.vehiclesOnRoad} on road`} tone="live" dot />
        )}
      </View>

      <View>
        <AppText variant="headlineMd" color={offline ? colors.textMuted : colors.onSurface}>
          {route.name}
        </AppText>
        <View style={styles.viaRow}>
          <Icon name="route" size={14} color={colors.textMuted} />
          <AppText variant="bodySm" color={colors.textMuted} style={styles.viaText}>
            {route.via}
          </AppText>
        </View>
      </View>

      {route.directionsOnRoad ? (
        <View style={styles.directions} testID={`route-directions-${route.code}`}>
          {route.directionsOnRoad.map((d) => (
            <View key={d.label} style={styles.directionRow}>
              <Icon name="directions-bus" size={14} color={d.count > 0 ? colors.liveStrong : colors.textMuted} />
              <AppText variant="bodySm" color={colors.onSurface} style={styles.directionLabel}>
                {d.label}
              </AppText>
              <AppText variant="labelBadge" weight="bold" color={d.count > 0 ? colors.liveStrong : colors.textMuted}>
                {`${d.count} on road`}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.infoBox}>
        <View style={styles.infoMain}>
          <AppText variant="labelBadge" color={colors.textMuted}>
            {offline ? 'LIVE STATUS' : 'CORRIDOR DISTANCE'}
          </AppText>
          {offline ? (
            <AppText variant="bodyMd" weight="bold" color={colors.textMuted}>
              Walay Available Driver
            </AppText>
          ) : (
            <AppText variant="labelTelemetry" weight="bold" tabular>
              {route.distance ? `${route.distance} • ${route.stops} Stops` : `${route.stops} Stops`}
            </AppText>
          )}
        </View>
        <View style={styles.infoCol}>
          <AppText variant="labelBadge" color={colors.textMuted}>
            Base Fare
          </AppText>
          <AppText variant="labelTelemetry" weight="bold" tabular>
            {formatPeso(route.baseFare)}
          </AppText>
        </View>
        <View style={styles.infoRight}>
          <AppText variant="labelBadge" color={colors.textMuted}>
            Track Pass
          </AppText>
          <AppText variant="labelTelemetry" weight="bold" color={offline ? colors.textMuted : colors.amberStrong}>
            {offline ? '₱0 (No Charge)' : `₱${route.trackPassFare} / view`}
          </AppText>
        </View>
      </View>

      <View style={styles.footer}>
        {offline ? (
          <>
            <View style={styles.notes}>
              <View style={styles.noteRow}>
                <Icon name="verified-user" size={14} color={colors.liveStrong} />
                <AppText variant="bodySm" weight="semibold" style={styles.noteText}>
                  Dili ma-deduct ang ₱1 (0 driver online)
                </AppText>
              </View>
            </View>
            <Button
              label="No Charge (₱0)"
              icon="lock"
              size="sm"
              disabled
              testID={`no-charge-${route.code}`}
              style={styles.action}
            />
          </>
        ) : (
          <>
            <View style={styles.notes}>
              <View style={styles.noteRow}>
                <Icon name={paid ? 'timer' : 'lock-clock'} size={14} color={paid ? colors.liveStrong : colors.brand} />
                <AppText
                  variant="bodySm"
                  weight="semibold"
                  color={paid ? colors.liveStrong : undefined}
                  style={styles.noteText}
                  testID={`live-access-${route.code}`}>
                  {paid ? `Live access • ${minutesLeft} min left` : 'Live map locked • Pay ₱1'}
                </AppText>
              </View>
              <View style={styles.noteRow}>
                <Icon name="map" size={14} color={colors.liveStrong} />
                <AppText variant="bodySm" color={colors.textMuted} style={styles.noteText}>
                  Opens route-filtered live GPS map
                </AppText>
              </View>
            </View>
            <Button
              label={paid ? 'View Live' : 'View Live (₱1)'}
              icon={paid ? 'timer' : 'map'}
              onPress={() => onViewLive(route)}
              accessibilityLabel={
                paid ? `View Live ${route.name}, ${minutesLeft} minutes left` : `View Live (₱1) ${route.name}`
              }
              testID={`view-live-${route.code}`}
              style={styles.action}
            />
          </>
        )}
      </View>
    </Card>
  );
}
