import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useDuty } from '@/hooks/useDuty';
import { useSession } from '@/hooks/useSession';
import {
  getComplianceDocs,
  getDriverIdentity,
  getDriverMetrics,
  getDriverProfileDetails,
} from '@/services/driverService';
import type { DriverMetric } from '@/types/driver';
import { formatPeso } from '@/utils/currency';
import { useDriverMe } from '@packages/tanstack/query/driver';
import { AppText } from '@packages/ui/AppText';
import { Avatar } from '@packages/ui/Avatar';
import { Badge } from '@packages/ui/Badge';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';
import { ListRow } from '@packages/ui/ListRow';
import { ScreenScroll } from '@packages/ui/ScreenScroll';
import { SectionHeader } from '@packages/ui/SectionHeader';
import { StatTile } from '@packages/ui/StatTile';
import { TopBar } from '@packages/ui/TopBar';

import { styles } from './styles';
import { ThisPhoneCard } from './ThisPhoneCard';

/** Maps the mock data's semantic metric tones to v3 icon tiles. */
const METRIC_COLORS: Record<DriverMetric['tone'], { icon: string; bg: string }> = {
  emerald: { icon: colors.liveStrong, bg: colors.liveTint },
  primary: { icon: colors.brand, bg: colors.brandTint },
  amber: { icon: colors.amberStrong, bg: colors.amberTint },
};

export function DriverProfileScreen() {
  const driver = getDriverIdentity();
  const metrics = getDriverMetrics().metrics;
  const details = getDriverProfileDetails();
  const docs = getComplianceDocs();
  const session = useSession();
  const duty = useDuty();
  const me = useDriverMe();
  const [gcashEnabled, setGcashEnabled] = useState(true);

  const lockForNextShift = () => {
    // Ending a shift locks the app; the PIN opens it for the next shift.
    session.lock();
    router.replace('/pin');
  };

  const endShift = () => {
    const unit = me.data?.assignment?.unitCode;
    if (!duty.assignmentId) {
      Alert.alert('End shift?', 'You have no assignment right now. Para will lock until your next shift.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Shift', style: 'destructive', onPress: lockForNextShift },
      ]);
      return;
    }
    Alert.alert(
      'End shift and submit manifest?',
      `This completes your assignment${unit ? ` on ${unit}` : ''} and stops live tracking. Your fleet assigns your next unit.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Shift',
          style: 'destructive',
          onPress: () => {
            duty
              .endShift()
              .then(lockForNextShift, (error: unknown) =>
                Alert.alert(
                  'Shift not ended',
                  error instanceof Error ? error.message : 'Check your connection and try again.',
                ),
              );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root} testID="screen-driver-profile">
      <TopBar
        variant="driver"
        driverId={driver.id}
        driverName={driver.shortName}
        statusLabel={driver.status}
        balance={formatPeso(driver.walletBalance)}
      />
      <ScreenScroll>
        <Card style={styles.card}>
          <View style={styles.rowTop}>
            <Avatar initials={driver.fullInitials} size={80} verified accessibilityLabel={driver.legalName} />
            <View style={styles.identity}>
              <View style={styles.rowBetween}>
                <AppText variant="labelBadge" weight="bold" color={colors.brandStrong}>
                  {driver.id}
                </AppText>
                <Badge label={driver.rank} tone="live" dot />
              </View>
              <AppText variant="headlineMd" numberOfLines={1}>
                {driver.legalName}
              </AppText>
              <AppText variant="bodySm" color={colors.textMuted} numberOfLines={1}>
                {driver.cooperative}
              </AppText>
              <View style={styles.rating}>
                <Icon name="star" size={16} color={colors.amber} />
                <AppText variant="headlineSm" weight="extrabold" tabular>
                  {driver.rating.toFixed(1)}
                </AppText>
                <AppText variant="labelBadge" color={colors.textMuted}>
                  {`${driver.safeTrips} safe trips`}
                </AppText>
              </View>
            </View>
          </View>
          <View style={styles.certs}>
            {details.certifications.map((cert) => (
              <Badge key={cert.id} label={cert.label} icon={cert.icon} tone="info" size="md" />
            ))}
          </View>
        </Card>

        <View style={styles.metrics}>
          {metrics.map((metric) => (
            <StatTile
              key={metric.id}
              value={metric.value}
              caption={metric.label}
              icon={metric.icon}
              iconColor={METRIC_COLORS[metric.tone].icon}
              iconBackground={METRIC_COLORS[metric.tone].bg}
              testID={`metric-${metric.id}`}
            />
          ))}
        </View>

        <Card style={styles.card}>
          <SectionHeader
            title="Assigned Unit & Route"
            icon="directions-bus"
            right={<Badge label={details.unitNumber} tone="brand" />}
          />
          <View style={styles.unitBox}>
            <View style={styles.rowBetween}>
              <View>
                <AppText variant="labelBadge" color={colors.textMuted}>
                  PLATE NUMBER
                </AppText>
                <AppText variant="headlineSm" weight="extrabold" tabular>
                  {details.plate}
                </AppText>
              </View>
              <View style={styles.alignEnd}>
                <AppText variant="labelBadge" color={colors.textMuted}>
                  CLASSIFICATION
                </AppText>
                <AppText variant="labelBadge" weight="bold">
                  {details.classification}
                </AppText>
              </View>
            </View>
            <View style={styles.routeTag}>
              <Badge label={details.routeTag} tone="route" />
            </View>
            <AppText variant="headlineSm">{details.terminals}</AppText>
            <AppText variant="bodySm" color={colors.textMuted}>
              {details.via}
            </AppText>
            <View style={styles.specRow}>
              <View style={styles.spec}>
                <Icon name="airline-seat-recline-normal" size={18} color={colors.textMuted} />
                <View style={styles.flex}>
                  <AppText variant="labelBadge" color={colors.textMuted}>
                    Capacity
                  </AppText>
                  <AppText variant="labelBadge" weight="bold">
                    {details.capacity}
                  </AppText>
                </View>
              </View>
              <View style={styles.spec}>
                <Icon name="videocam" size={18} color={colors.liveStrong} />
                <View style={styles.flex}>
                  <AppText variant="labelBadge" color={colors.textMuted}>
                    Dual Cam & Telemetry
                  </AppText>
                  <AppText variant="labelBadge" weight="bold" color={colors.liveStrong}>
                    {details.cameraStatus}
                  </AppText>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.checklist}>
            <Icon name="task-alt" size={20} color={colors.liveStrong} />
            <View style={styles.flex}>
              <AppText variant="labelBadge" weight="bold">
                Daily Pre-Shift Checklist
              </AppText>
              <AppText variant="bodySm" color={colors.textMuted}>
                {details.checklist}
              </AppText>
            </View>
            <Button label="View Log" variant="ghost" size="sm" color={colors.brandStrong} testID="view-checklist-log" />
          </View>
        </Card>

        <Card style={styles.card}>
          <SectionHeader
            title="Cooperative & Payouts"
            icon="account-balance"
            iconColor={colors.amber}
            right={
              <View style={styles.autoSync}>
                <View style={styles.greenDot} />
                <AppText variant="labelBadge" weight="semibold" color={colors.liveStrong}>
                  Auto-Sync
                </AppText>
              </View>
            }
          />
          <View style={styles.payout}>
            <View style={styles.phoneIcon}>
              <Icon name="smartphone" size={20} color={colors.onSurface} />
            </View>
            <View style={styles.flex}>
              <View style={styles.payoutLabel}>
                <AppText variant="labelBadge" weight="bold" style={styles.shrink}>
                  {details.payoutWallet}
                </AppText>
                <Badge label="VERIFIED" tone="live" />
              </View>
              <AppText variant="bodySm" color={colors.textMuted} tabular>
                {details.payoutNumber}
              </AppText>
            </View>
            <Switch
              testID="gcash-switch"
              accessibilityLabel="GCash daily auto-payout"
              value={gcashEnabled}
              onValueChange={setGcashEnabled}
              trackColor={{ false: colors.surfaceContainerHighest, true: colors.brand }}
              thumbColor={colors.surfaceCard}
              ios_backgroundColor={colors.surfaceContainerHighest}
            />
          </View>
          <AppText variant="bodySm" color={colors.textMuted}>
            {details.payoutNote}
          </AppText>
          <View style={styles.payout}>
            <View style={styles.savingsIcon}>
              <Icon name="savings" size={20} color={colors.amberStrong} />
            </View>
            <View style={styles.flex}>
              <AppText variant="labelBadge" weight="bold">
                Coop Capital Savings
              </AppText>
              <AppText variant="bodySm" color={colors.textMuted}>
                {details.savingsRate}
              </AppText>
            </View>
            <AppText variant="labelEta" color={colors.amberStrong} tabular>
              {formatPeso(details.savingsTotal)}
            </AppText>
          </View>
          <View style={styles.actions}>
            <Button label="Dispatch Hub" icon="support-agent" variant="tonal" flex testID="dispatch-hub" />
            <Button label="SOS Terminal" icon="sos" variant="danger-soft" flex testID="sos-terminal" />
          </View>
        </Card>

        <Card style={styles.card}>
          <SectionHeader
            title="Compliance & Document Vault"
            icon="badge"
            right={
              <AppText variant="labelBadge" weight="semibold" color={colors.liveStrong}>
                {`${docs.length} / ${docs.length} Valid`}
              </AppText>
            }
          />
          <View style={styles.docs}>
            {docs.length === 0 ? (
              <AppText variant="bodyMd" color={colors.textMuted}>
                No documents on file
              </AppText>
            ) : (
              docs.map((doc) => (
                <ListRow
                  key={doc.id}
                  title={doc.title}
                  subtitle={doc.subtitle}
                  subtitleColor={colors.liveStrong}
                  icon={doc.icon}
                  iconBackground={colors.surfaceCard}
                  chevron
                  onPress={() => undefined}
                  testID={`doc-${doc.id}`}
                />
              ))
            )}
          </View>
        </Card>

        <ThisPhoneCard />

        <Button
          label={duty.busy ? 'Ending shift…' : 'End Shift & Submit Daily Manifest'}
          icon="logout"
          variant="primary"
          size="lg"
          fullWidth
          textVariant="headlineSm"
          disabled={duty.busy}
          onPress={endShift}
          testID="end-shift"
          style={styles.endShift}
        />
        <AppText variant="labelBadge" color={colors.textMuted} style={styles.version}>
          {details.versionLine.toUpperCase()}
        </AppText>
      </ScreenScroll>
    </View>
  );
}

export default DriverProfileScreen;
