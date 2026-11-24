import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../AppText';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { colors, spacing } from '../theme';
import { styles } from './styles';

export type ParaAdViewerProps = {
  businessName: string;
  headline: string;
  imageUrl: string;
  /** Optional link button, e.g. "Order now". */
  ctaLabel?: string | null;
  /** Seconds before Continue unlocks; 0 = ready. */
  secondsLeft: number;
  /** Minutes of live view Continue gives. */
  minutes: number;
  /** Continue is busy (the view is being confirmed). */
  busy?: boolean;
  onContinue: () => void;
  /** The close button, shown only once the countdown is over; closing then continues like Continue. */
  onClose: () => void;
  onCta?: () => void;
  testID?: string;
};

/**
 * A local business's Para Ad (para-ads) as a full-screen photo viewer: black backdrop, the whole photo fitted in the
 * middle, "Sponsored" with the business on top, the headline and a countdown before Continue at the bottom. The close
 * button appears only when the countdown is over (like a rewarded ad), and closing then gives the live view too.
 */
export function ParaAdViewer({
  businessName,
  headline,
  imageUrl,
  ctaLabel,
  secondsLeft,
  minutes,
  busy,
  onContinue,
  onClose,
  onCta,
  testID,
}: ParaAdViewerProps) {
  const insets = useSafeAreaInsets();
  const ready = secondsLeft <= 0;
  return (
    <View style={styles.root} testID={testID}>
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.who}>
          <Badge label="Sponsored" tone="glass" />
          <AppText variant="headlineSm" color={colors.onDark} numberOfLines={1} accessibilityRole="header">
            {businessName}
          </AppText>
        </View>
        {ready ? (
          <IconButton
            icon="close"
            variant="glass"
            accessibilityLabel={`Close ad and open ${minutes} min live view`}
            onPress={onClose}
            testID="para-ad-close"
          />
        ) : null}
      </View>

      <View style={styles.photoArea}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.photo}
          resizeMode="contain"
          accessibilityLabel={`${businessName} ad`}
          testID="para-ad-photo"
        />
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.md }]}>
        <AppText variant="bodyLg" color={colors.onPhotoMuted} numberOfLines={3}>
          {headline}
        </AppText>
        {ctaLabel && onCta ? (
          <Button label={ctaLabel} icon="open-in-new" variant="glass" onPress={onCta} testID="para-ad-cta" />
        ) : null}
        <Button
          label={ready ? `Continue • ${minutes} min live view` : `Live view unlocks in ${secondsLeft}`}
          icon={ready ? 'radar' : 'hourglass-top'}
          size="lg"
          disabled={!ready || busy}
          onPress={onContinue}
          accessibilityLabel={ready ? 'Continue to live jeepneys' : `Live view unlocks in ${secondsLeft} seconds`}
          testID="para-ad-continue"
        />
      </View>
    </View>
  );
}
