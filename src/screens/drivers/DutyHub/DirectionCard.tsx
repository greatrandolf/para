import { Fragment } from 'react';
import { View } from 'react-native';

import { colors } from '@/constants/theme';
import type { DirectionInfo, DutyDirection } from '@/types/driver';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';
import { SegmentedControl, type SegmentOption } from '@packages/ui/SegmentedControl';

import { directionStyles as styles, styles as shared } from './styles';

type Props = {
  corridor: string;
  directions: DirectionInfo[];
  current: DirectionInfo;
  paxWaiting: string;
  onChange: (direction: DutyDirection) => void;
  onSwitch: () => void;
};

export function DirectionCard({ corridor, directions, current, paxWaiting, onChange, onSwitch }: Props) {
  const options: SegmentOption<DutyDirection>[] = directions.map((direction) => ({
    value: direction.id,
    label: direction.tabLabel,
    icon: direction.tabIcon,
    testID: `duty-direction-${direction.id}`,
  }));
  const lastIndex = current.waypoints.length - 1;
  return (
    <Card style={shared.card} testID="duty-direction-card">
      <View style={styles.header}>
        <View style={shared.tileBrand}>
          <Icon name="swap-calls" size={22} color={colors.brand} />
        </View>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <AppText variant="headlineSm" weight="bold" accessibilityRole="header">
              Route 17B Direction
            </AppText>
            <Badge label="LIVE GPS ACTIVE" tone="live" dot />
          </View>
          <AppText variant="bodySm" color={colors.textMuted}>
            {corridor}
          </AppText>
        </View>
        <Button
          label="Switch"
          icon="sync-alt"
          size="sm"
          variant="secondary"
          onPress={onSwitch}
          testID="duty-direction-switch"
        />
      </View>

      <SegmentedControl<DutyDirection>
        options={options}
        value={current.id}
        onChange={onChange}
        accessibilityLabel="Route direction"
      />

      <View style={styles.detail} testID="duty-direction-detail">
        <View style={styles.metaRow}>
          <Badge label={current.badge} tone={current.id === 'apas' ? 'liveSolid' : 'brandSolid'} dot />
          <AppText variant="labelBadge" weight="bold">
            {current.origin}
          </AppText>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Icon name="group" size={14} color={colors.textMuted} />
            <AppText variant="bodySm" color={colors.textMuted}>
              {current.density}
            </AppText>
          </View>
          <AppText variant="bodySm" color={colors.textMuted}>
            {current.headway}
          </AppText>
        </View>
        <AppText variant="labelBadge" color={colors.textMuted}>
          Waypoint Sequence:
        </AppText>
        <View style={styles.waypoints} testID="duty-waypoints">
          {current.waypoints.map((stop, index) => {
            // DESIGN timeline: completed nodes `textSubtle`, upcoming `live`, the current
            // stop a pulsing `brand` node with its label in `brandStrong`.
            const isCurrent = index === current.currentIndex;
            const isDone = index < current.currentIndex;
            const isLast = index === lastIndex;
            const color = isCurrent ? colors.brandStrong : isDone ? colors.textMuted : colors.onSurface;
            return (
              <Fragment key={stop}>
                <View style={styles.stop} testID={`waypoint-${index}`}>
                  {isCurrent ? (
                    <View style={styles.nodeCurrentRing}>
                      <View style={[styles.node, styles.nodeCurrent]} testID="waypoint-current-node" />
                    </View>
                  ) : (
                    <View style={[styles.node, isDone ? styles.nodeDone : styles.nodeNext]} />
                  )}
                  <AppText
                    variant="labelBadge"
                    weight={isCurrent ? 'extrabold' : 'semibold'}
                    color={color}
                    style={isCurrent ? styles.current : undefined}>
                    {stop}
                  </AppText>
                </View>
                {isLast ? null : <View style={styles.line} />}
              </Fragment>
            );
          })}
        </View>
        <View style={styles.nextRow}>
          <View style={styles.nextStop}>
            <Icon name="pin-drop" size={16} color={colors.brand} />
            <AppText variant="bodySm" color={colors.textMuted} style={styles.nextStopText}>
              {'Next Stop: '}
              <AppText variant="bodySm" weight="bold" color={colors.onSurface}>
                {current.nextStop}
              </AppText>
            </AppText>
          </View>
          <Badge label={paxWaiting} tone="live" />
        </View>
      </View>
    </Card>
  );
}
