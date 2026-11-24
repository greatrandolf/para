import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/theme';
import { formatPeso } from '@/utils/currency';
import type { DriverPayout } from '@packages/tanstack/query/driver';
import { AppText } from '@packages/ui/AppText';
import { Badge, type BadgeTone } from '@packages/ui/Badge';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { Icon, type IconName } from '@packages/ui/Icon';
import { SectionHeader } from '@packages/ui/SectionHeader';

import { styles } from './styles';

const DAY = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** "Nov 9 – Nov 15" for a Monday–Sunday week. */
export const weekLabel = (start: string, end: string) =>
  `${DAY.format(new Date(`${start}T00:00:00Z`))} – ${DAY.format(new Date(`${end}T00:00:00Z`))}`;

const STATUS: Record<DriverPayout['status'], { label: string; tone: BadgeTone; icon: IconName; tile: object }> = {
  paid: { label: 'Paid', tone: 'live', icon: 'check', tile: styles.checkIcon },
  unpaid: { label: 'Pending', tone: 'fare', icon: 'schedule', tile: styles.pendingIcon },
  carried: { label: 'Carried over', tone: 'neutral', icon: 'more-horiz', tile: styles.carriedIcon },
};

export type FleetPayoutsProps = {
  payouts: readonly DriverPayout[] | undefined;
  loading: boolean;
  error?: string;
  /** The payout whose receipt or answer is being sent. */
  busyId?: string;
  onRetry: () => void;
  onReceipt: (payout: DriverPayout) => void;
  onReceived: (payout: DriverPayout) => void;
  onProblem: (payout: DriverPayout) => void;
};

/**
 * Payouts from the driver's fleet (fleet-driver-payouts): every week the fleet sends the driver's share by GCash
 * and Para issues a receipt. The driver can open the receipt and confirm it or report a problem.
 */
export function FleetPayouts({
  payouts,
  loading,
  error,
  busyId,
  onRetry,
  onReceipt,
  onReceived,
  onProblem,
}: FleetPayoutsProps) {
  return (
    <>
      <SectionHeader title="Payouts from your fleet" right={<Badge label="WEEKLY • GCASH" tone="info" />} />
      <Card style={styles.entries} testID="fleet-payouts">
        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.payoutsLoading} />
        ) : error ? (
          <View style={styles.payoutEmpty}>
            <AppText variant="bodyMd" color={colors.textMuted}>
              {error}
            </AppText>
            <Button label="Try again" icon="refresh" variant="secondary" size="sm" onPress={onRetry} />
          </View>
        ) : !payouts?.length ? (
          <AppText variant="bodyMd" color={colors.textMuted} style={styles.payoutEmpty}>
            No payouts yet. Every Monday your fleet pays last week&apos;s ₱1 view shares to your GCash, and your receipt
            shows up here.
          </AppText>
        ) : (
          payouts.map((p, index) => {
            const status = STATUS[p.status];
            const busy = busyId === p.settlementId;
            return (
              <View
                key={p.settlementId}
                style={[styles.payout, index > 0 && styles.entryDivider]}
                testID={`payout-${p.settlementId}`}>
                <View style={styles.entry}>
                  <View style={status.tile}>
                    <Icon name={status.icon} size={18} color={colors.onSurface} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="headlineSm">{weekLabel(p.periodStart, p.periodEnd)}</AppText>
                    <AppText variant="labelBadge" color={colors.textMuted}>
                      {`${p.fleetName} • ${p.views} ${p.views === 1 ? 'view' : 'views'}`}
                    </AppText>
                    <AppText variant="labelBadge" color={colors.textMuted}>
                      {p.status === 'paid'
                        ? `Receipt ${p.receiptNo ?? ''} • GCash ${p.gcashMasked}`
                        : p.status === 'unpaid'
                          ? `Your fleet sends this to GCash ${p.gcashMasked || 'on file'}`
                          : 'Under ₱0.01 — added to next week'}
                    </AppText>
                  </View>
                  <View style={styles.trailing}>
                    <AppText variant="labelEta" tabular>
                      {formatPeso(p.payCentavos / 100)}
                    </AppText>
                    <Badge label={status.label} tone={status.tone} />
                  </View>
                </View>
                {p.status === 'paid' ? (
                  <View style={styles.payoutActions}>
                    <Button
                      label={busy ? 'Opening…' : 'Receipt'}
                      icon="receipt-long"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onPress={() => onReceipt(p)}
                      testID={`receipt-${p.settlementId}`}
                    />
                    {p.driverResponse ? (
                      <Badge
                        label={p.driverResponse.response === 'received' ? 'You confirmed it' : 'Problem reported'}
                        tone={p.driverResponse.response === 'received' ? 'live' : 'error'}
                      />
                    ) : (
                      <>
                        <Button
                          label="I received it"
                          icon="check-circle"
                          variant="primary"
                          size="sm"
                          disabled={busy}
                          onPress={() => onReceived(p)}
                          testID={`received-${p.settlementId}`}
                        />
                        <Button
                          label="Report a problem"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onPress={() => onProblem(p)}
                          testID={`problem-${p.settlementId}`}
                        />
                      </>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </Card>
    </>
  );
}
