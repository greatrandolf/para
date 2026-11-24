import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { useDuty } from '@/hooks/useDuty';
import { useDriverMe } from '@packages/tanstack/query/driver';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Icon } from '@packages/ui/Icon';

import { TYPE_LABEL, assignmentBadge, formatDay } from './MyAssignmentCard';

/**
 * The driver's assignment (unit, status, route, vehicle), full width at the top of the Driver Hub page, under the
 * fixed top bar. It scrolls with the page (Revision 22b).
 */
export function DriverHubHeader() {
  const me = useDriverMe();
  const duty = useDuty();
  const a = me.data?.assignment;
  const badge = a ? assignmentBadge(a.vehicleStatus, duty.ready ? duty.dutyStatus : a.dutyStatus) : undefined;

  return (
    <View style={styles.bar} testID="driver-hub-header">
      <View style={styles.assignment} testID="my-assignment">
        {me.isLoading ? (
          <ActivityIndicator color={colors.brand} />
        ) : me.error || !me.data ? (
          <View style={styles.unitRow}>
            <AppText variant="bodySm" color={colors.textMuted} style={styles.flex}>
              {me.error?.message ?? 'Your assignment could not be loaded.'}
            </AppText>
            <Pressable accessibilityRole="button" onPress={() => void me.refetch()} hitSlop={8}>
              <AppText variant="labelAction" color={colors.brandStrong}>
                Try again
              </AppText>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.unitRow}>
              <View style={styles.flex}>
                <AppText variant="labelBadge" weight="bold" color={colors.textMuted} numberOfLines={1}>
                  {`MY ASSIGNMENT • ${me.data.fleet.name.toUpperCase()}`}
                </AppText>
                <AppText variant="headlineSm" weight="bold" numberOfLines={1}>
                  {a ? `${a.unitCode} • ${a.plate}` : 'Not assigned yet'}
                </AppText>
              </View>
              {badge ? <Badge label={badge.label} tone={badge.tone} testID="assignment-duty" /> : null}
            </View>
            {a ? (
              <>
                <View style={styles.fact}>
                  <Icon name="alt-route" size={16} color={colors.textMuted} />
                  <AppText variant="bodySm" weight="semibold" numberOfLines={1} style={styles.flex}>
                    {a.routeCode ? `${a.routeCode}${a.routeName ? ` • ${a.routeName}` : ''}` : 'No route yet'}
                  </AppText>
                </View>
                <View style={styles.fact}>
                  <Icon name="airport-shuttle" size={16} color={colors.textMuted} />
                  <AppText variant="bodySm" color={colors.textMuted} numberOfLines={1} style={styles.flex}>
                    {`${a.make} • ${TYPE_LABEL[a.type]} • ${a.seats} seats${a.start ? ` • since ${formatDay(a.start)}` : ''}`}
                  </AppText>
                </View>
              </>
            ) : (
              <AppText variant="bodySm" color={colors.textMuted}>
                Your fleet assigns your unit and route. They will show here as soon as they do.
              </AppText>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full width inside the page's side margins, flush with its top.
  bar: {
    marginHorizontal: -spacing.margin,
    marginTop: -spacing.md,
    paddingTop: spacing.gutterSm,
    backgroundColor: colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingHorizontal: spacing.margin,
    paddingBottom: spacing.gutterSm,
    gap: spacing.gutterSm,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 },
  flex: { flex: 1, flexShrink: 1 },
  logo: {
    width: 32,
    height: 32,
    borderRadius: radius.base,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.live },
  dutyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: spacing.sm,
    paddingRight: 3,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  dutyDot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.live },
  dutyId: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  assignment: { gap: spacing.xs },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fact: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
