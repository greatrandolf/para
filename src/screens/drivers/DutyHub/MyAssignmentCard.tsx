import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useDuty } from '@/hooks/useDuty';
import { useDriverMe, type DriverMe, type DutyStatus } from '@packages/tanstack/query/driver';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';

import { styles } from './styles';

export const TYPE_LABEL = { modern: 'Modern PUV', traditional: 'Traditional', electric: 'Electric' } as const;

const STATUS_BADGE = {
  active: { label: 'In service', tone: 'live' },
  standby: { label: 'Standby', tone: 'neutral' },
  maintenance: { label: 'In the shop', tone: 'fare' },
  inactive: { label: 'Inactive', tone: 'offline' },
} as const;

const DUTY_BADGE = {
  ready: { label: 'Ready to start', tone: 'neutral' },
  in_service: { label: 'In service', tone: 'live' },
  on_break: { label: 'On break', tone: 'fare' },
  off_duty: { label: 'Off duty', tone: 'neutral' },
} as const;

/** The duty status while the unit runs; the unit's own status when it is in the shop or inactive. */
export function assignmentBadge(vehicleStatus: keyof typeof STATUS_BADGE, dutyStatus: DutyStatus) {
  return vehicleStatus === 'active' || vehicleStatus === 'standby'
    ? DUTY_BADGE[dutyStatus]
    : STATUS_BADGE[vehicleStatus];
}

export const formatDay = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * The unit and route the driver's fleet assigned (from the backend). Read-only: only the fleet changes it.
 * Updates live: the duty listener refreshes it when the fleet changes the assignment.
 */
export function MyAssignmentCard() {
  const me = useDriverMe();
  const duty = useDuty();

  if (me.isLoading) {
    return (
      <Card style={styles.card} testID="my-assignment">
        <ActivityIndicator color={colors.brand} />
      </Card>
    );
  }
  if (me.error || !me.data) {
    return (
      <Card style={styles.card} testID="my-assignment">
        <AppText variant="bodySm" color={colors.textMuted}>
          {me.error?.message ?? 'Your assignment could not be loaded.'}
        </AppText>
        <Button label="Try again" variant="tonal" onPress={() => void me.refetch()} />
      </Card>
    );
  }
  return <AssignmentDetails me={me.data} dutyStatus={duty.ready ? duty.dutyStatus : undefined} />;
}

export function AssignmentDetails({ me, dutyStatus }: { me: DriverMe; dutyStatus?: DutyStatus }) {
  const a = me.assignment;
  const badge = a ? assignmentBadge(a.vehicleStatus, dutyStatus ?? a.dutyStatus) : undefined;
  return (
    <Card style={styles.card} testID="my-assignment">
      <View style={styles.rowTop}>
        <View style={styles.tileBrand}>
          <Icon name="directions-bus" size={20} color={colors.brand} />
        </View>
        <View style={styles.flex}>
          <AppText variant="labelBadge" weight="bold" color={colors.textMuted}>
            MY ASSIGNMENT • {me.fleet.name.toUpperCase()}
          </AppText>
          <AppText variant="headlineSm" weight="bold" accessibilityRole="header">
            {a ? `${a.unitCode} • ${a.plate}` : 'Not assigned yet'}
          </AppText>
        </View>
        {badge ? <Badge label={badge.label} tone={badge.tone} testID="assignment-duty" /> : null}
      </View>
      {a ? (
        <View style={styles.assignmentFacts}>
          <Fact
            icon="alt-route"
            label="Route"
            value={a.routeCode ? `${a.routeCode}${a.routeName ? ` • ${a.routeName}` : ''}` : 'No route yet'}
          />
          <Fact icon="airport-shuttle" label="Unit" value={`${a.make} • ${TYPE_LABEL[a.type]} • ${a.seats} seats`} />
          {a.start ? <Fact icon="event" label="Since" value={formatDay(a.start)} /> : null}
        </View>
      ) : (
        <AppText variant="bodySm" color={colors.textMuted}>
          Your fleet assigns your unit and route. They will show here as soon as they do.
        </AppText>
      )}
      {/* <AppText variant="bodySm" color={colors.textSubtle}>
        {me.driver.name} • {me.driver.driverNo}
        {me.driver.licenseRenewalSoon ? ' • License renewal due soon' : ''}
      </AppText> */}
    </Card>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: 'alt-route' | 'airport-shuttle' | 'event';
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={16} color={colors.textMuted} />
      <AppText variant="bodySm" color={colors.textMuted} style={styles.factLabel}>
        {label}
      </AppText>
      <AppText variant="bodySm" weight="semibold" style={styles.flex}>
        {value}
      </AppText>
    </View>
  );
}
