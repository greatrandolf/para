import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { colors } from '@/constants/theme';
import { microToPeso, useDriverEarnings } from '@/hooks/useDriverEarnings';
import { useDuty } from '@/hooks/useDuty';
import { usePassengerLoad } from '@/hooks/usePassengerLoad';
import { useDriverMe, useDriverPayBalance } from '@packages/tanstack/query/driver';
import {
  getAssignment,
  getBroadcastStatus,
  getDirection,
  getDirections,
  getDriverIdentity,
  toggleDirection,
} from '@/services/driverService';
import type { DutyDirection } from '@/types/driver';
import { formatPeso } from '@/utils/currency';
import { AppText } from '@packages/ui/AppText';
import { Avatar } from '@packages/ui/Avatar';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { GradientCard } from '@packages/ui/GradientCard';
import { Icon } from '@packages/ui/Icon';
import { ScreenScroll } from '@packages/ui/ScreenScroll';
import { TopBar } from '@packages/ui/TopBar';

import { BroadcastCard } from './BroadcastCard';
import { CorridorMiniMap } from './CorridorMiniMap';
import { DirectionCard } from './DirectionCard';
import { DriverHubHeader } from './DriverHubHeader';
import { EarningsBreakdown } from './EarningsBreakdown';
import { PassengerLoadCard } from './PassengerLoadCard';
import { styles } from './styles';

/** How long "Reported!" stays on the report button (matches the design script). */
export const REPORT_FEEDBACK_MS = 2200;

/** How long the passenger load card takes to slide in or out. */
const LOAD_CARD_MS = 280;

export function DutyHubScreen() {
  const driver = getDriverIdentity();
  const assignment = getAssignment();
  const directions = getDirections();
  const status = getBroadcastStatus();
  const earnings = useDriverEarnings();
  // What the fleet still owes the driver, across days (driver-pay-balance); refreshed whenever today's earnings move.
  const balance = useDriverPayBalance();
  const refetchBalance = balance.refetch;
  useEffect(() => {
    if (earnings.views > 0) void refetchBalance();
  }, [earnings.views, refetchBalance]);

  const [directionId, setDirectionId] = useState<DutyDirection>('apas');
  const duty = useDuty();
  // Revision 21: the unit's live passenger load, while the driver has an assigned unit.
  const me = useDriverMe().data;
  const unit = me?.assignment;
  const fleetName = me?.fleet.name;
  const load = usePassengerLoad(unit?.seats);
  const showLoadCard = !!unit && unit.seats > 0 && duty.dutyStatus === 'in_service';
  const [reported, setReported] = useState(false);
  const reportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (reportTimer.current) clearTimeout(reportTimer.current);
    },
    [],
  );

  const direction = getDirection(directionId);

  const report = () => {
    if (reportTimer.current) clearTimeout(reportTimer.current);
    setReported(true);
    reportTimer.current = setTimeout(() => {
      setReported(false);
      reportTimer.current = null;
    }, REPORT_FEEDBACK_MS);
  };

  return (
    <View style={styles.root} testID="screen-duty-hub">
      <TopBar
        variant="brand"
        subtitle="DRIVER HUB"
        right={
          <>
            <View style={styles.dutyChip} accessible accessibilityLabel={`${driver.status} ${driver.id}`}>
              <View style={styles.dutyDot} />
              <AppText variant="labelBadge" weight="semibold" color={colors.onSurface}>
                {driver.status}
              </AppText>
              <View style={styles.dutyId}>
                <AppText variant="labelBadge" color={colors.onSurface} tabular>
                  {driver.id}
                </AppText>
              </View>
            </View>
            <Avatar initials={driver.initials} />
          </>
        }
      />
      <ScreenScroll testID="duty-hub-scroll">
        <DriverHubHeader />

        {/* Revision 21a: only while tracking (in service). It slides in on Start Tracking and out on Stop Tracking;
            the cards below glide to their new place. */}
        {showLoadCard ? (
          <Animated.View
            entering={FadeInDown.duration(LOAD_CARD_MS)}
            exiting={FadeOutUp.duration(LOAD_CARD_MS)}
            testID="passenger-load-reveal">
            <PassengerLoadCard
              capacity={unit.seats}
              occupied={load.occupied}
              onChange={load.change}
              routeCode={unit.routeCode}
              error={load.saveError}
            />
          </Animated.View>
        ) : null}

        <Animated.View layout={LinearTransition.duration(LOAD_CARD_MS)}>
          <BroadcastCard
            status={status}
            duty={duty}
            reported={reported}
            onToggleTracking={() => void duty.setBreak(duty.dutyStatus === 'in_service')}
            onReport={report}
          />
        </Animated.View>

        <Animated.View layout={LinearTransition.duration(LOAD_CARD_MS)}>
          <GradientCard preset="dailyEarnings" style={styles.earnings} testID="daily-earnings-card">
            <AppText variant="labelBadge" weight="semibold" color={colors.textMuted}>
              {"TODAY'S INSTANT DAILY EARNINGS"}
            </AppText>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <View style={styles.bigRow}>
                  <AppText variant="metricDisplay" color={colors.neonOrangeDeep} tabular testID="today-earnings">
                    {formatPeso(earnings.driver)}
                  </AppText>
                </View>
                <AppText variant="bodySm" color={colors.textMuted} testID="today-views">
                  {earnings.views === 0
                    ? 'No views shared with your unit yet today.'
                    : `${earnings.views} ${earnings.views === 1 ? 'view' : 'views'} today • ${earnings.driverPct ?? 60}% of your unit's ${formatPeso(earnings.unit)}`}
                </AppText>
                <EarningsBreakdown
                  sources={earnings.sources}
                  toPay={
                    balance.data
                      ? { amount: microToPeso(balance.data.toPayMicro), views: balance.data.toPayViews }
                      : undefined
                  }
                />
                <View style={styles.releaseRow}>
                  <Icon name="bolt" size={14} color={colors.brand} />
                  {/* Fleet-driver-payouts: the fleet pays each week's shares by GCash. */}
                  <AppText variant="bodySm" color={colors.textMuted} style={styles.flex} testID="payout-note">
                    {'Paid weekly by '}
                    <AppText variant="bodySm" weight="bold" color={colors.onSurface}>
                      {fleetName ?? 'your fleet'}
                    </AppText>
                    {' to your '}
                    <AppText variant="bodySm" weight="bold" color={colors.onSurface}>
                      GCash
                    </AppText>
                    {' every Monday'}
                  </AppText>
                </View>
              </View>
              {/* <Button label="Payout Log" icon="receipt-long" size="sm" style={styles.payout} testID="payout-log" /> */}
            </View>
          </GradientCard>
        </Animated.View>

        {/* Shared-view-earnings: the Route View Bonus Pool card and the ₱20 duty base are removed. */}

        <Animated.View layout={LinearTransition.duration(LOAD_CARD_MS)}>
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.tileBrand}>
                <Icon name="contact-support" size={20} color={colors.brand} />
              </View>
              <View style={styles.flex}>
                <AppText variant="labelTelemetry" weight="bold">
                  Dispatcher Support
                </AppText>
                <AppText variant="bodySm" color={colors.textMuted}>
                  Cebu Central Terminal • Route 17B Dispatch Desk
                </AppText>
              </View>
              <Button label="Call Hotline" icon="call" variant="secondary" size="sm" testID="call-hotline" />
            </View>
          </Card>
        </Animated.View>
      </ScreenScroll>
    </View>
  );
}

export default DutyHubScreen;
