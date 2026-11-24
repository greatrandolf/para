import { useState } from 'react';
import { Alert, Linking, View } from 'react-native';

import { colors } from '@/constants/theme';
import { manilaDay, useDriverEarnings } from '@/hooks/useDriverEarnings';
import { getDriverIdentity } from '@/services/driverService';
import { formatPeso } from '@/utils/currency';
import { useConfirmPayout, useDriverPayouts, useReceiptUrl, type DriverPayout } from '@packages/tanstack/query/driver';
import { AppText } from '@packages/ui/AppText';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';
import { ScreenScroll } from '@packages/ui/ScreenScroll';
import { TopBar } from '@packages/ui/TopBar';

import { EarningsHistory, TodayByUnit } from './EarningsHistory';
import { FleetPayouts, weekLabel } from './FleetPayouts';
import { styles } from './styles';

/**
 * The driver's Earnings tab (driver-unit-earnings): today per unit (live), the history by period, day and unit down
 * to each ₱1 view, and the payouts from the fleet with their receipts. Earnings belong to the driver; the unit is
 * where they were earned, so a driver who changes units sees each one.
 */
export function EarningsPoolScreen() {
  const driver = getDriverIdentity();
  const today = useDriverEarnings();
  const [day] = useState(() => manilaDay());
  const payouts = useDriverPayouts();
  const confirm = useConfirmPayout();
  const receiptUrl = useReceiptUrl();
  const [busyId, setBusyId] = useState<string>();

  const openReceipt = (p: DriverPayout) => {
    if (!p.payoutId) return;
    setBusyId(p.settlementId);
    receiptUrl.mutate(p.payoutId, {
      onSuccess: (url) => void Linking.openURL(url),
      onError: (e) => Alert.alert('Receipt not available', e.message),
      onSettled: () => setBusyId(undefined),
    });
  };

  const answer = (p: DriverPayout, response: 'received' | 'problem', note?: string) => {
    setBusyId(p.settlementId);
    confirm.mutate(
      { settlementId: p.settlementId, response, note },
      {
        onSuccess: () =>
          response === 'problem'
            ? Alert.alert('Problem reported', `${p.fleetName} can see it on this week's payout.`)
            : undefined,
        onError: (e) => Alert.alert('Not sent', e.message),
        onSettled: () => setBusyId(undefined),
      },
    );
  };

  const reportProblem = (p: DriverPayout) =>
    Alert.alert('Report a problem', `${weekLabel(p.periodStart, p.periodEnd)} • ${formatPeso(p.payCentavos / 100)}`, [
      { text: 'Not received', onPress: () => answer(p, 'problem', 'I did not receive this payout in GCash.') },
      { text: 'Wrong amount', onPress: () => answer(p, 'problem', 'The amount I received is different.') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <View style={styles.root} testID="screen-earnings">
      <TopBar
        variant="driver"
        driverId={driver.id}
        driverName={driver.shortName}
        statusLabel={driver.status}
        balance={formatPeso(today.driver)}
      />
      <ScreenScroll>
        <TodayByUnit total={today.driver} views={today.views} units={today.units} />

        <EarningsHistory today={day} payouts={payouts.data ?? []} />

        <FleetPayouts
          payouts={payouts.data}
          loading={payouts.isLoading}
          error={payouts.error ? 'Your payouts could not be loaded.' : undefined}
          busyId={busyId}
          onRetry={() => void payouts.refetch()}
          onReceipt={openReceipt}
          onReceived={(p) => answer(p, 'received')}
          onProblem={reportProblem}
        />

        <Card variant="tinted" style={styles.footer}>
          <View style={styles.row}>
            <Icon name="info" size={18} color={colors.liveStrong} />
            <AppText variant="labelTelemetry" weight="bold">
              How you earn
            </AppText>
          </View>
          <AppText variant="bodySm" color={colors.textMuted} align="center">
            Each ₱1 a commuter pays to see live jeepneys is shared by the jeepneys coming their way. You get your
            percentage of your unit&apos;s share, in whichever unit you drive. Your fleet pays you by GCash.
          </AppText>
        </Card>
      </ScreenScroll>
    </View>
  );
}

export default EarningsPoolScreen;
