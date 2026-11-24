import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '../AppText';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { colors } from '../theme';
import { styles } from './styles';

export type JeepWatchBannerProps = {
  /** `watching`: waiting for a jeepney; `coming`: one is on its way. */
  status: 'watching' | 'coming';
  /** Whole minutes left on the watch. */
  minutesLeft?: number;
  /** How many jeepneys are coming and on which routes (when `coming`). */
  count?: number;
  routeCodes?: string[];
  /** Price label on the view button, e.g. "₱1". */
  fare: string;
  /** Under ₱1 (ad-supported-live-view): the button watches an ad instead of paying. */
  byAd?: boolean;
  onView: () => void;
  onCancel: () => void;
  busy?: boolean;
  testID?: string;
};

/**
 * The free "Notify me when one is coming" banner (jeep-coming-alert): while watching it shows the minutes left and
 * Cancel; when a jeepney starts coming it offers the paid live view.
 */
export function JeepWatchBanner({
  status,
  minutesLeft,
  count = 0,
  routeCodes = [],
  fare,
  byAd = false,
  onView,
  onCancel,
  busy,
  testID = 'jeep-watch-banner',
}: JeepWatchBannerProps) {
  const coming = status === 'coming';
  const routes = routeCodes.length ? routeCodes.join(', ') : 'A jeepney';
  const title = coming
    ? count > 1
      ? `${count} jeepneys coming your way (${routes})`
      : `${routes} is coming your way`
    : 'Watching for jeepneys coming your way';
  const subtitle = coming
    ? byAd
      ? 'Watch a short ad to see it live.'
      : `See it live for ${fare}.`
    : `We'll tell you when one is coming. Free${minutesLeft ? ` • ${minutesLeft} min left` : ''}.`;

  return (
    <View
      style={[styles.base, coming ? styles.coming : styles.watching]}
      testID={testID}
      accessibilityLiveRegion="polite">
      {busy ? (
        <ActivityIndicator color={colors.brand} />
      ) : (
        <Icon
          name={coming ? 'directions-bus' : 'notifications-active'}
          size={20}
          color={coming ? colors.liveStrong : colors.brand}
        />
      )}
      <View style={styles.text}>
        <AppText variant="labelTelemetry" weight="bold" testID={`${testID}-title`}>
          {title}
        </AppText>
        <AppText variant="bodySm" color={colors.textMuted} testID={`${testID}-subtitle`}>
          {subtitle}
        </AppText>
      </View>
      {coming ? (
        <Button
          label={byAd ? 'Watch ad • view live' : `${fare} view live`}
          size="sm"
          onPress={onView}
          disabled={busy}
          testID={`${testID}-view`}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={coming ? 'Dismiss' : 'Stop watching'}
        onPress={onCancel}
        disabled={busy}
        hitSlop={8}
        style={styles.cancel}
        testID={`${testID}-cancel`}>
        {coming ? (
          <Icon name="close" size={20} color={colors.textMuted} />
        ) : (
          <AppText variant="labelAction" color={colors.brandStrong}>
            Cancel
          </AppText>
        )}
      </Pressable>
    </View>
  );
}
