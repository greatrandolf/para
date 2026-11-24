import { View } from 'react-native';

import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { colors } from '../theme';
import { styles } from './styles';

export type ArrivalEtaCardProps = {
  /** Minutes until the next jeep reaches the boarding stop; undefined when none is heading there. */
  minutes?: number;
  /** Where the commuter boards, e.g. "General Maxilom Ave". */
  stopName?: string;
  /** A second line under it, e.g. "You're on the road" or "120 m walk". */
  detail?: string;
  /** How the view was unlocked, e.g. "₱1 PAID" or "AD VIEW". */
  tag?: string;
  /** Small status under the minutes (default "ON THE WAY"). */
  status?: string;
  testID?: string;
};

/**
 * The unlocked arrival ETA (live-arrival-card): an orange card with an open lock, "UNLOCKED ARRIVAL ETA" with how it
 * was unlocked, where to board, and a see-through box with the minutes until the next jeep arrives.
 */
export function ArrivalEtaCard({ minutes, stopName, detail, tag, status = 'ON THE WAY', testID }: ArrivalEtaCardProps) {
  const unit = minutes === 1 ? 'MIN' : 'MINS';
  return (
    <View
      style={styles.card}
      testID={testID}
      accessible
      accessibilityLabel={
        minutes === undefined
          ? 'Unlocked arrival ETA: no jeep heading to your stop yet'
          : `Unlocked arrival ETA: ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}${stopName ? `, board at ${stopName}` : ''}`
      }>
      <View style={styles.icon}>
        <Icon name="lock-open" size={22} color={colors.onBrandAction} />
      </View>
      <View style={styles.text}>
        <View style={styles.labelRow}>
          <AppText variant="labelBadge" weight="bold" color={colors.onBrandAction} uppercase style={styles.label}>
            Unlocked arrival ETA
          </AppText>
          {tag ? (
            <View style={styles.tag} testID={testID ? `${testID}-tag` : undefined}>
              <AppText variant="labelBadge" weight="bold" color={colors.onBrandAction} uppercase>
                {tag}
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="bodyMd" weight="bold" color={colors.onBrandAction} numberOfLines={1}>
          {stopName ? `Board at: ${stopName}` : 'No jeep heading to your stop yet'}
        </AppText>
        {detail ? (
          <AppText variant="bodySm" color={colors.onBrandMuted} numberOfLines={1}>
            {detail}
          </AppText>
        ) : null}
      </View>
      <View style={styles.eta}>
        <View style={styles.minutesRow} testID={testID ? `${testID}-minutes` : undefined}>
          <AppText variant="metricDisplay" color={colors.onBrandAction} tabular>
            {minutes === undefined ? '—' : String(minutes)}
          </AppText>
          {minutes === undefined ? null : (
            <AppText variant="labelBadge" weight="bold" color={colors.onBrandAction}>
              {unit}
            </AppText>
          )}
        </View>
        <AppText variant="labelBadge" color={colors.onBrandMuted} uppercase numberOfLines={1}>
          {minutes === undefined ? 'WAITING' : status}
        </AppText>
      </View>
    </View>
  );
}
