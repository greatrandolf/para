import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { colors } from '@/constants/theme';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Icon } from '@packages/ui/Icon';

import { seatsText, type RouteUnit } from './commuteOptions';
import { unitStyles as styles } from './styles';

type Props = {
  routeCode: string;
  units: RouteUnit[];
};

/**
 * The jeeps on the selected route (route-units), as a dropdown under its card: the ones coming to the commuter's
 * stop soonest first (the first is the one tracked on the arrival card), then the ones not heading there.
 */
export function RouteUnits({ routeCode, units }: Props) {
  const [open, setOpen] = useState(true);
  if (units.length === 0) return null;
  const count = `${units.length} ${units.length === 1 ? 'jeep' : 'jeeps'} on Route ${routeCode}`;
  return (
    <View style={styles.wrap} testID={`route-units-${routeCode}`}>
      <Pressable
        style={styles.header}
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${count}. ${open ? 'Hide' : 'Show'} them`}
        testID={`route-units-${routeCode}-toggle`}>
        <Icon name="directions-bus" size={18} color={colors.brandStrong} />
        <AppText variant="bodyMd" weight="bold" style={styles.headerText}>
          {count}
        </AppText>
        <Icon name={open ? 'expand-less' : 'expand-more'} size={22} color={colors.textMuted} />
      </Pressable>
      {open
        ? units.map((u, i) => {
            const tracked = i === 0 && u.coming;
            return (
              <View
                key={u.driverId}
                style={[styles.row, tracked && styles.rowTracked]}
                testID={`route-unit-${u.driverId}`}>
                <View style={styles.rowText}>
                  <AppText
                    variant="labelTelemetry"
                    weight="bold"
                    color={tracked ? colors.onBrandAction : colors.onSurface}>
                    {[u.unitCode, u.plate].filter(Boolean).join(' • ') || 'Jeep'}
                  </AppText>
                  {u.seatsFree !== undefined ? (
                    <AppText
                      variant="bodySm"
                      weight="semibold"
                      color={tracked ? colors.onBrandAction : u.seatsFree > 0 ? colors.liveStrong : colors.textMuted}>
                      {seatsText(u.seatsFree)}
                    </AppText>
                  ) : null}
                </View>
                {tracked ? <Badge label="Tracked" tone="glass" /> : null}
                <AppText
                  variant="labelTelemetry"
                  tabular
                  color={tracked ? colors.onBrandAction : u.coming ? colors.brandStrong : colors.textMuted}>
                  {u.coming ? `${u.minutes} min` : 'Not your way'}
                </AppText>
              </View>
            );
          })
        : null}
    </View>
  );
}
