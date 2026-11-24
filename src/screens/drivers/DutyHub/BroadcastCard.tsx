import { Linking, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { DutyValue } from '@/hooks/useDuty';
import { SEND_EVERY_MS } from '@/services/liveLocation';
import type { BroadcastStatus } from '@/types/driver';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Button } from '@packages/ui/Button';
import { GradientCard } from '@packages/ui/GradientCard';
import { Icon } from '@packages/ui/Icon';

import { broadcastStyles as styles } from './styles';

type Props = {
  status: BroadcastStatus;
  duty: Pick<DutyValue, 'assignmentId' | 'dutyStatus' | 'tracking' | 'busy' | 'error' | 'ready'>;
  reported: boolean;
  onToggleTracking: () => void;
  onReport: () => void;
};

const timeOf = (ms: number) =>
  new Date(ms).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit' });

/** Title, subtitle and help text for the driver's duty and GPS state. */
export function broadcastView(duty: Props['duty']): {
  live: boolean;
  title: string;
  subtitle: string;
  help?: string;
  /** GPS keeps running with the phone locked (driver-background-gps). */
  background?: boolean;
} {
  if (!duty.ready) return { live: false, title: 'CONNECTING…', subtitle: 'CHECKING YOUR ASSIGNMENT' };
  if (!duty.assignmentId) {
    return {
      live: false,
      title: 'NO ASSIGNED VEHICLE',
      subtitle: 'LIVE GPS DISABLED',
      help: 'You can start live GPS once your fleet assigns your unit and route.',
    };
  }
  if (duty.dutyStatus === 'ready') {
    return {
      live: false,
      title: 'READY TO START',
      subtitle: 'UNIT ASSIGNED • GPS NOT SENT',
      help: 'Tap Start Tracking when you begin your trip. Commuters see your jeep once you start.',
    };
  }
  if (duty.dutyStatus === 'on_break') {
    return {
      live: false,
      title: 'ON BREAK',
      subtitle: 'TRACKING PAUSED • NO GPS SENT',
      help: 'Resume Tracking when you are back in service.',
    };
  }
  const t = duty.tracking;
  switch (t.state) {
    case 'denied':
    case 'error':
      return { live: false, title: 'LOCATION OFF', subtitle: 'IN SERVICE • GPS NOT SENT', help: t.message };
    case 'live':
      return {
        live: true,
        title: 'BROADCASTING LIVE',
        subtitle: t.lastSentAt ? `LAST SENT ${timeOf(t.lastSentAt).toUpperCase()}` : 'WAITING FOR GPS FIX',
        // driver-background-gps: without "Always", GPS stops when the phone locks.
        help:
          t.error ??
          (t.background
            ? undefined
            : "Set Para's location to \"Always\" in Settings so GPS keeps running when the phone is locked."),
        background: !!t.background,
      };
    default:
      return { live: false, title: 'STARTING GPS…', subtitle: 'IN SERVICE' };
  }
}

export function BroadcastCard({ status, duty, reported, onToggleTracking, onReport }: Props) {
  const view = broadcastView(duty);
  const onBreak = duty.dutyStatus === 'on_break';
  const notStarted = duty.dutyStatus === 'ready';
  const canToggle = duty.ready && !!duty.assignmentId && !duty.busy;
  const denied = duty.tracking.state === 'denied' && duty.dutyStatus === 'in_service' && !!duty.assignmentId;

  return (
    <GradientCard preset={view.live ? 'broadcast' : 'broadcastPaused'} style={styles.card} testID="broadcast-card">
      <View style={styles.top}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, !view.live && styles.statusDotPaused]} />
          <View style={styles.statusText}>
            <AppText variant="headlineSm" weight="extrabold" color={colors.onDark} testID="broadcast-status">
              {view.title}
            </AppText>
            <AppText variant="labelBadge" color={colors.onDarkMuted} testID="broadcast-subtitle">
              {view.subtitle}
            </AppText>
          </View>
        </View>
        <View style={styles.battery} accessible accessibilityLabel={`Battery ${status.battery}%`}>
          <Icon name="battery-charging-full" size={14} color={colors.onDark} />
          <AppText variant="labelBadge" weight="bold" color={colors.onDark} tabular>
            {`${status.battery}%`}
          </AppText>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoItem}>
          <Icon name="sensors" size={14} color={colors.tertiaryFixed} />
          <AppText variant="bodySm" color={colors.onDarkMuted}>
            {'GPS Ping: '}
            <AppText variant="bodySm" weight="bold" color={colors.onDark}>
              {view.live ? `Every ${SEND_EVERY_MS / 1000}s` : 'Off'}
            </AppText>
          </AppText>
        </View>
        <View style={styles.infoItem}>
          <AppText variant="bodySm" color={colors.onDarkMuted}>
            Sharing:
          </AppText>
          <Badge
            label={view.live ? (view.background ? 'Always on' : 'While app is open') : 'Paused'}
            tone={view.live ? 'liveSolid' : 'glass'}
            testID="sharing-badge"
          />
        </View>
      </View>

      {view.help || duty.error ? (
        <AppText variant="bodySm" color={colors.onDark} testID="broadcast-help">
          {duty.error ?? view.help}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        {denied ? (
          <Button
            label="Open Settings"
            icon="settings"
            variant="glass"
            flex
            onPress={() => void Linking.openSettings()}
            testID="location-settings"
          />
        ) : duty.assignmentId ? (
          <Button
            label={
              duty.busy ? 'Saving…' : notStarted ? 'Start Tracking' : onBreak ? 'Resume Tracking' : 'Stop Tracking (Break)'
            }
            icon={notStarted ? 'gps-fixed' : onBreak ? 'play-arrow' : 'pause'}
            variant="glass"
            flex
            disabled={!canToggle}
            onPress={onToggleTracking}
            testID="tracking-toggle"
          />
        ) : (
          // No assigned vehicle: live GPS is shown, but off until the fleet assigns one.
          <Button
            label="Start Tracking"
            icon="gps-off"
            variant="glass"
            flex
            disabled
            accessibilityHint="Available once your fleet assigns your unit"
            testID="tracking-toggle"
          />
        )}
        <Button
          label={reported ? 'Reported!' : 'Report Delay / Issue'}
          icon={reported ? 'check-circle' : 'report-problem'}
          variant="glass"
          flex
          onPress={onReport}
          testID="report-delay"
        />
      </View>
    </GradientCard>
  );
}
