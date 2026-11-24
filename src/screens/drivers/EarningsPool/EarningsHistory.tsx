import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { TodayUnit } from '@/hooks/useDriverEarnings';
import { formatPeso } from '@/utils/currency';
import {
  useEarningsDay,
  useEarningsSummary,
  type DriverDay,
  type DriverPayout,
  type EarningEntry,
  type UnitDay,
} from '@packages/tanstack/query/driver';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';
import { SectionHeader } from '@packages/ui/SectionHeader';
import { SegmentedControl } from '@packages/ui/SegmentedControl';

import {
  PERIODS,
  dayLabel,
  exactPeso,
  microPeso,
  payoutsForDay,
  periodRange,
  sharedText,
  timeText,
  type PeriodKey,
} from './earningsText';
import { styles } from './styles';

/** "PARA-00001 • GMD-7234 • 17B" */
const unitLine = (u: { unitCode: string; plate: string; routeCode: string }) =>
  [u.unitCode || 'Unit', u.plate, u.routeCode].filter(Boolean).join(' • ');

/**
 * Today, per unit driven (driver-unit-earnings): live from the driver's day record, so it moves as commuters pay.
 */
export function TodayByUnit({ total, views, units }: { total: number; views: number; units: readonly TodayUnit[] }) {
  return (
    <Card style={styles.card} testID="today-by-unit">
      <View style={styles.rowTop}>
        <View style={styles.flex}>
          <AppText variant="labelBadge" color={colors.textMuted}>
            {"TODAY'S EARNINGS"}
          </AppText>
          <AppText variant="headlineLgMobile" color={colors.neonOrangeDeep} tabular testID="today-total">
            {formatPeso(total)}
          </AppText>
          <AppText variant="bodySm" color={colors.textMuted}>
            {views === 0 ? 'No ₱1 views yet today.' : `${views} ${views === 1 ? 'view' : 'views'} today`}
          </AppText>
        </View>
        <View style={styles.totalIcon}>
          <Icon name="payments" size={24} color={colors.brand} />
        </View>
      </View>
      {units.map((u) => (
        <View key={u.vehicleId} style={styles.unitRow} testID={`today-unit-${u.unitCode}`}>
          <View style={styles.unitIcon}>
            <Icon name="directions-bus" size={18} color={colors.brand} />
          </View>
          <View style={styles.flex}>
            <AppText variant="headlineSm">{u.unitCode || 'Unit'}</AppText>
            <AppText variant="labelBadge" color={colors.textMuted}>
              {[u.plate, u.routeCode, `${u.views} ${u.views === 1 ? 'view' : 'views'}`].filter(Boolean).join(' • ')}
            </AppText>
          </View>
          <AppText variant="labelEta" tabular>
            {formatPeso(u.driver)}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

/**
 * Earnings history by unit (driver-unit-earnings): a period's total and units, then each day with its units and the
 * payout it belongs to; a day opens to every ₱1 view that paid the driver.
 */
export function EarningsHistory({ today, payouts }: { today: string; payouts: readonly DriverPayout[] }) {
  const [period, setPeriod] = useState<PeriodKey>('week');
  const range = periodRange(period, today);
  const summary = useEarningsSummary(range);
  const [open, setOpen] = useState<string>();
  const data = summary.data;

  return (
    <>
      <SectionHeader title="Earnings by unit" right={<Badge label="LAST 90 DAYS" tone="info" />} />
      <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} accessibilityLabel="Period" />
      <Card style={styles.card} testID="earnings-period">
        {summary.isLoading ? (
          <ActivityIndicator color={colors.brand} style={styles.payoutsLoading} />
        ) : summary.error ? (
          <View style={styles.payoutEmpty}>
            <AppText variant="bodyMd" color={colors.textMuted}>
              Your earnings could not be loaded.
            </AppText>
            <Button
              label="Try again"
              icon="refresh"
              variant="secondary"
              size="sm"
              onPress={() => void summary.refetch()}
            />
          </View>
        ) : !data || data.days.length === 0 ? (
          <AppText variant="bodyMd" color={colors.textMuted} style={styles.payoutEmpty} testID="earnings-empty">
            No ₱1 views in this period. Earnings appear here as commuters view your jeepney live.
          </AppText>
        ) : (
          <>
            <View style={styles.rowTop}>
              <View style={styles.flex}>
                <AppText variant="labelBadge" color={colors.textMuted}>
                  {PERIODS.find((p) => p.value === period)?.label.toUpperCase()}
                </AppText>
                <AppText variant="headlineLgMobile" tabular testID="period-total">
                  {microPeso(data.totals.driverMicro)}
                </AppText>
                <AppText variant="bodySm" color={colors.textMuted}>
                  {`${data.totals.views} ${data.totals.views === 1 ? 'view' : 'views'} • ${data.days.length} ${data.days.length === 1 ? 'day' : 'days'}`}
                </AppText>
              </View>
            </View>
            {data.totals.units.map((u) => (
              <UnitBar key={u.vehicleId} unit={u} of={data.totals.driverMicro} fleet={data.fleets[u.ownerUid]} />
            ))}
          </>
        )}
      </Card>

      {data?.days.map((d) => (
        <DayRow
          key={d.day}
          day={d}
          today={today}
          payouts={payoutsForDay(payouts, d.day)}
          open={open === d.day}
          onToggle={() => setOpen((o) => (o === d.day ? undefined : d.day))}
        />
      ))}
    </>
  );
}

function UnitBar({ unit: u, of, fleet }: { unit: UnitDay; of: number; fleet?: string }) {
  const share = of > 0 ? Math.max(0.04, u.driverMicro / of) : 0;
  return (
    <View style={styles.unitBar} testID={`period-unit-${u.unitCode}`}>
      <View style={styles.rowBetween}>
        <AppText variant="labelTelemetry" weight="bold" style={styles.flex} numberOfLines={1}>
          {unitLine(u)}
        </AppText>
        <AppText variant="labelEta" tabular>
          {microPeso(u.driverMicro)}
        </AppText>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round(share * 100)}%` }]} />
      </View>
      <AppText variant="labelBadge" color={colors.textMuted}>
        {`${u.views} ${u.views === 1 ? 'view' : 'views'}${fleet ? ` • ${fleet}` : ''}`}
      </AppText>
    </View>
  );
}

function DayRow({
  day: d,
  today,
  payouts,
  open,
  onToggle,
}: {
  day: DriverDay;
  today: string;
  payouts: { label: string; paid: boolean }[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Card style={styles.card} testID={`day-${d.day}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${dayLabel(d.day, today)}, ${microPeso(d.driverMicro)}`}
        onPress={onToggle}
        style={styles.rowTop}>
        <View style={styles.flex}>
          <AppText variant="headlineSm">{dayLabel(d.day, today)}</AppText>
          <AppText variant="labelBadge" color={colors.textMuted}>
            {`${d.views} ${d.views === 1 ? 'view' : 'views'}`}
            {d.driverPct !== null ? ` • ${d.driverPct}% of your unit's ${microPeso(d.unitEarnedMicro)}` : ''}
          </AppText>
          <View style={styles.chips}>
            {d.units.map((u) => (
              <Badge key={u.vehicleId} label={`${u.unitCode} ${microPeso(u.driverMicro)}`} tone="brand" />
            ))}
            {payouts.map((p, i) => (
              <Badge key={i} label={p.label} tone={p.paid ? 'live' : 'fare'} />
            ))}
          </View>
        </View>
        <View style={styles.trailing}>
          <AppText variant="labelEta" tabular>
            {microPeso(d.driverMicro)}
          </AppText>
          <Icon name={open ? 'expand-less' : 'expand-more'} size={20} color={colors.textMuted} />
        </View>
      </Pressable>
      {open ? <DayDetail day={d.day} /> : null}
    </Card>
  );
}

/** One day's units and every ₱1 view that paid the driver, newest first, grouped by unit. */
function DayDetail({ day }: { day: string }) {
  const q = useEarningsDay(day);
  if (q.isLoading) return <ActivityIndicator color={colors.brand} style={styles.payoutsLoading} />;
  if (q.error)
    return (
      <AppText variant="bodySm" color={colors.textMuted}>
        This day could not be loaded.
      </AppText>
    );
  const pages = q.data?.pages ?? [];
  const units = pages[0]?.day.units ?? [];
  const entries = pages.flatMap((p) => p.entries);
  const byUnit = new Map<string, EarningEntry[]>();
  for (const e of entries) byUnit.set(e.vehicleId, [...(byUnit.get(e.vehicleId) ?? []), e]);
  const groups = units.length
    ? units.map((u) => ({
        key: u.vehicleId,
        title: unitLine(u),
        total: u.driverMicro,
        views: u.views,
        list: byUnit.get(u.vehicleId) ?? [],
      }))
    : [...byUnit.entries()].map(([key, list]) => ({
        key,
        title: unitLine(list[0]),
        total: list.reduce((t, e) => t + e.driverMicro, 0),
        views: list.length,
        list,
      }));
  return (
    <View style={styles.dayDetail} testID={`day-detail-${day}`}>
      {groups.map((g) => {
        const times = g.list.map((e) => e.at).filter(Boolean);
        return (
          <View key={g.key} style={styles.unitGroup}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <AppText variant="labelTelemetry" weight="bold">
                  {g.title}
                </AppText>
                <AppText variant="labelBadge" color={colors.textMuted}>
                  {`${g.views} ${g.views === 1 ? 'view' : 'views'}`}
                  {times.length ? ` • ${timeText(Math.min(...times))} – ${timeText(Math.max(...times))}` : ''}
                </AppText>
              </View>
              <AppText variant="labelEta" tabular>
                {microPeso(g.total)}
              </AppText>
            </View>
            {g.list.map((e) => (
              <View key={e.id} style={styles.entryLine} testID={`entry-${e.id}`}>
                <AppText variant="labelBadge" tabular color={colors.textMuted} style={styles.entryTime}>
                  {timeText(e.at)}
                </AppText>
                <AppText variant="bodySm" style={styles.flex}>
                  {`${e.routeCode || 'Route'} • ${sharedText(e.sharedWith)}`}
                </AppText>
                <AppText variant="labelBadge" weight="bold" tabular color={colors.liveStrong}>
                  {`+${exactPeso(e.driverMicro)}`}
                </AppText>
              </View>
            ))}
          </View>
        );
      })}
      {q.hasNextPage ? (
        <Button
          label={q.isFetchingNextPage ? 'Loading…' : 'Load more'}
          variant="secondary"
          size="sm"
          disabled={q.isFetchingNextPage}
          onPress={() => void q.fetchNextPage()}
          testID={`more-${day}`}
        />
      ) : null}
    </View>
  );
}
