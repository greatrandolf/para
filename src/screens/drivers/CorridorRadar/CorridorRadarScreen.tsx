import { router } from 'expo-router';
import { Pressable, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';
import { getDriverIdentity, getRadarSnapshot, getStopDemand } from '@/services/driverService';
import type { DemandLevel } from '@/types/driver';
import { formatPeso } from '@/utils/currency';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { GradientCard } from '@packages/ui/GradientCard';
import { Icon, type IconName } from '@packages/ui/Icon';
import { ProgressBar } from '@packages/ui/ProgressBar';
import { ScreenScroll } from '@packages/ui/ScreenScroll';
import { SectionHeader } from '@packages/ui/SectionHeader';
import { TopBar } from '@packages/ui/TopBar';

import { RadarMap } from './RadarMap';
import { styles } from './styles';

/** Heatmap tile tones: label text uses the strong variant, the icon the bright accent (W3/W4). */
const DEMAND_TONE: Record<DemandLevel, { tile: ViewStyle; text: string; icon: string }> = {
  high: { tile: styles.heatHigh, text: colors.brandStrong, icon: colors.brand },
  approaching: { tile: styles.heatApproaching, text: colors.amberStrong, icon: colors.amber },
  steady: { tile: styles.heatSteady, text: colors.liveStrong, icon: colors.live },
};

type QuickActionTone = 'fare' | 'neutral' | 'danger';
type QuickAction = { label: string; icon: IconName; testID: string; tone: QuickActionTone };

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Report Hazard / Baha', icon: 'flood', testID: 'report-hazard', tone: 'fare' },
  { label: 'Terminal Check-In', icon: 'how-to-reg', testID: 'terminal-check-in', tone: 'neutral' },
  { label: 'SOS Dispatch', icon: 'emergency-share', testID: 'sos-dispatch', tone: 'danger' },
];

const ACTION_TILE = { fare: styles.actionFare, neutral: null, danger: styles.actionDanger } as const;
const ACTION_ICON = { fare: colors.amberStrong, neutral: colors.brand, danger: colors.onDark } as const;
const ACTION_TEXT = { fare: colors.amberStrong, neutral: colors.onSurface, danger: colors.onDark } as const;

export function CorridorRadarScreen() {
  const driver = getDriverIdentity();
  const radar = getRadarSnapshot();
  const demand = getStopDemand();
  const vacant = radar.seatsTotal - radar.seatsUsed;

  return (
    <View style={styles.root} testID="screen-radar">
      <TopBar
        variant="driver"
        driverId={driver.id}
        driverName={driver.shortName}
        statusLabel={driver.status}
        balance={formatPeso(driver.walletBalance)}
      />
      <ScreenScroll>
        <Card variant="tinted" style={styles.lock}>
          <View style={styles.row}>
            <View style={styles.lockDot} />
            <AppText variant="labelBadge" weight="semibold" color={colors.liveStrong}>
              {radar.rtkLock}
            </AppText>
            <AppText variant="labelBadge" color={colors.textMuted} numberOfLines={1} style={styles.flex}>
              {`• ${radar.corridor}`}
            </AppText>
            <Badge label={radar.fareNote} icon="sensors" tone="brand" />
          </View>
          <View style={styles.unitCard}>
            <AppText variant="headlineMd" weight="extrabold" color={colors.brandStrong} tabular>
              {radar.plate}
            </AppText>
            <Badge label={radar.unit} tone="fareSolid" />
            <AppText variant="bodySm" color={colors.textMuted} numberOfLines={1} style={styles.flex}>
              {radar.heading}
            </AppText>
            <Icon name="broadcast-on-home" size={16} color={colors.liveStrong} />
            <AppText variant="labelBadge" weight="semibold" color={colors.liveStrong}>
              {radar.ping}
            </AppText>
          </View>
        </Card>

        <RadarMap radar={radar} />

        <Card style={styles.heat}>
          <SectionHeader
            title="Live Stop Demand Heatmap"
            icon="analytics"
            titleVariant="labelTelemetry"
            right={
              <AppText variant="labelBadge" weight="semibold" color={colors.brandStrong}>
                Peak Commuter Surge
              </AppText>
            }
          />
          <View style={styles.heatRow}>
            {demand.map((stop) => (
              <View key={stop.id} style={[styles.heatTile, DEMAND_TONE[stop.level].tile]} testID={`demand-${stop.id}`}>
                <View style={styles.rowBetween}>
                  <AppText variant="labelBadge" color={colors.textMuted} numberOfLines={1} style={styles.flex}>
                    {stop.name.toUpperCase()}
                  </AppText>
                  <Icon name={stop.icon} size={14} color={DEMAND_TONE[stop.level].icon} />
                </View>
                <AppText variant="metricDisplay" tabular>
                  {String(stop.pax)}
                </AppText>
                <AppText variant="labelBadge" weight="bold" color={DEMAND_TONE[stop.level].text}>
                  {stop.label}
                </AppText>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.telemetry}>
          <View style={styles.telemetryRow}>
            <View style={styles.telemetryTile}>
              <View style={styles.rowBetween}>
                <AppText variant="labelBadge" color={colors.textMuted} style={styles.flex}>
                  SPEED TELEMETRY
                </AppText>
                <Badge label="SAFE" tone="live" />
              </View>
              <View style={styles.metric}>
                <AppText variant="metricDisplay" tabular>
                  {String(radar.speed)}
                </AppText>
                <AppText variant="labelBadge" color={colors.textMuted}>
                  km/h
                </AppText>
              </View>
              <View style={styles.row}>
                <Icon name="speed" size={14} color={colors.textMuted} />
                <AppText variant="labelBadge" color={colors.textMuted} style={styles.flex}>
                  {`Corridor Limit: ${radar.speedLimit} km/h`}
                </AppText>
              </View>
            </View>
            <View style={styles.telemetryTile}>
              <View style={styles.rowBetween}>
                <AppText variant="labelBadge" color={colors.textMuted} style={styles.flex}>
                  SEATING MANIFEST
                </AppText>
                <Badge label={`${vacant} VACANT`} tone="fareSolid" />
              </View>
              <View style={styles.metric}>
                <AppText variant="metricDisplay" color={colors.neonOrangeDeep} tabular>
                  {String(radar.seatsUsed)}
                </AppText>
                <AppText variant="headlineSm" color={colors.textMuted}>
                  {`/ ${radar.seatsTotal} pax`}
                </AppText>
              </View>
              <ProgressBar
                value={radar.seatsUsed / radar.seatsTotal}
                tone="brand"
                accessibilityLabel="Seats occupied"
              />
            </View>
          </View>
          <View style={styles.target}>
            <Icon name="pin-drop" size={20} color={colors.brand} />
            <View style={styles.flex}>
              <AppText variant="labelBadge" color={colors.textMuted}>
                NEXT TARGET STATION
              </AppText>
              <AppText variant="headlineSm" numberOfLines={1}>
                {radar.nextStation}
              </AppText>
            </View>
            <View style={styles.targetRight}>
              <AppText variant="labelBadge" color={colors.textMuted}>
                ESTIMATED ARRIVAL
              </AppText>
              <AppText variant="labelEta" color={colors.liveStrong} tabular>
                {radar.eta}
              </AppText>
            </View>
          </View>
        </Card>

        <GradientCard preset="viewsAmber" direction="horizontal" style={styles.views} testID="views-card">
          <View style={styles.viewsIcon}>
            <Icon name="paid" size={26} color={colors.amberStrong} />
          </View>
          <View style={styles.flex}>
            <View style={styles.viewsTitle}>
              <AppText variant="headlineMd" color={colors.onAmber}>
                {`${radar.views} Commuter Views`}
              </AppText>
              <Badge label="LIVE POOL" tone="liveSolid" dot />
            </View>
            <AppText variant="labelBadge" weight="semibold" color={colors.onAmber} numberOfLines={2}>
              {`${formatPeso(radar.viewsEarned)} earned from active commuter radar telemetry`}
            </AppText>
          </View>
          <Button
            label="View Pot"
            variant="tonal-dark"
            size="sm"
            onPress={() => router.navigate('/earnings')}
            testID="view-pot"
          />
        </GradientCard>

        <View style={styles.actions}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.testID}
              testID={action.testID}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={({ pressed }) => [styles.action, ACTION_TILE[action.tone], pressed && styles.actionPressed]}>
              <Icon name={action.icon} size={26} color={ACTION_ICON[action.tone]} />
              <AppText variant="labelBadge" weight="bold" align="center" color={ACTION_TEXT[action.tone]}>
                {action.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </ScreenScroll>
    </View>
  );
}

export default CorridorRadarScreen;
