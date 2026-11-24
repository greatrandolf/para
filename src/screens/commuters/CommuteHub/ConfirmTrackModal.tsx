import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';
import type { TransitRoute } from '@/types/commuter';
import { formatPeso } from '@/utils/currency';
import { AppText } from '@packages/ui/AppText';
import { Button } from '@packages/ui/Button';
import { Icon } from '@packages/ui/Icon';
import { IconButton } from '@packages/ui/IconButton';

import { modalStyles as styles } from './styles';

/** One way the route runs, e.g. "Going to Sto. Niño". */
export type HeadingOption<K extends string = string> = { key: K; label: string };

type Props<K extends string = string> = {
  /** The route being paid for (its name and ₱ per view); the drawer is open while it is set. */
  route: Pick<TransitRoute, 'name' | 'trackPassFare'> | null;
  balance: number;
  onCancel: () => void;
  onConfirm: () => void;
  /**
   * The route's two directions. When given, the commuter must pick where they are going before Confirm & Track is
   * enabled (the ₱1 is shared by the jeepneys coming their way).
   */
  headings?: readonly HeadingOption<K>[];
  /** "pay": ₱1 from the wallet (default). "ad": under ₱1, watch a rewarded ad (ad-supported-live-view). */
  mode?: 'pay' | 'ad';
  /** Minutes of live view a watched ad gives. */
  adMinutes?: number;
  /** The picked direction, or undefined until the commuter picks one. */
  heading?: K;
  onPickHeading?: (key: K) => void;
};

/** Bottom drawer confirming a ₱1 live view (RN Modal, transparent, slide). */
export function ConfirmTrackModal<K extends string = string>({
  route,
  balance,
  onCancel,
  onConfirm,
  headings,
  heading,
  onPickHeading,
  mode = 'pay',
  adMinutes = 3,
}: Props<K>) {
  const ad = mode === 'ad';
  const insets = useSafeAreaInsets();
  const fare = route?.trackPassFare ?? 0;
  const needsHeading = !!headings?.length && heading === undefined;
  return (
    <Modal visible={route !== null} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.root} testID="confirm-track-modal">
        <Pressable style={styles.scrim} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              {/* Small orange text uses brandStrong (W3). */}
              <AppText variant="labelBadge" weight="semibold" color={colors.brandStrong}>
                LIVE SATELLITE UPLINK
              </AppText>
              <AppText variant="headlineMd" numberOfLines={2}>
                {route?.name ?? ''}
              </AppText>
            </View>
            <IconButton icon="close" variant="tonal" accessibilityLabel="Close" onPress={onCancel} />
          </View>
          {ad ? (
            <View style={styles.summary} testID="ad-summary">
              <View style={styles.summaryRow}>
                <AppText variant="bodyMd" color={colors.textMuted}>
                  Live view
                </AppText>
                <AppText variant="labelEta" tabular>
                  {`${adMinutes} min free`}
                </AppText>
              </View>
              <View style={styles.summaryRow}>
                <AppText variant="bodyMd" color={colors.textMuted}>
                  Watch
                </AppText>
                <AppText variant="labelEta">1 short ad</AppText>
              </View>
              {/* A watched ad unlocks only this route; ₱1 unlocks every route on the way. */}
              <View style={styles.summaryRow}>
                <AppText variant="bodyMd" color={colors.textMuted}>
                  Unlocks
                </AppText>
                <AppText variant="labelEta" numberOfLines={1} testID="ad-route-only">
                  {`${route?.name ?? 'This route'} only`}
                </AppText>
              </View>
            </View>
          ) : (
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <AppText variant="bodyMd" color={colors.textMuted}>
                  GPS View Access
                </AppText>
                <AppText variant="labelEta" tabular>
                  {formatPeso(fare)}
                </AppText>
              </View>
              <View style={styles.summaryRow}>
                <AppText variant="bodyMd" color={colors.textMuted}>
                  Wallet Remaining After
                </AppText>
                <AppText variant="labelEta" tabular color={colors.amberStrong}>
                  {formatPeso(balance - fare)}
                </AppText>
              </View>
            </View>
          )}
          {headings?.length ? (
            <View style={styles.directions} testID="heading-picker">
              <AppText variant="bodyMd" weight="semibold">
                Where are you going?
              </AppText>
              <View
                style={styles.directionRow}
                accessibilityRole="radiogroup"
                accessibilityLabel="Where are you going?">
                {headings.map((h) => {
                  const on = h.key === heading;
                  return (
                    <Pressable
                      key={h.key}
                      testID={`heading-${h.key}`}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={h.label}
                      onPress={() => onPickHeading?.(h.key)}
                      style={[styles.directionOption, on && styles.directionOptionOn]}>
                      <View style={[styles.directionDot, on && styles.directionDotOn]} />
                      <AppText
                        variant="bodySm"
                        weight={on ? 'bold' : 'semibold'}
                        color={on ? colors.brandStrong : colors.onSurface}
                        style={styles.guaranteeText}
                        numberOfLines={2}>
                        {h.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
              {needsHeading ? (
                <AppText variant="bodySm" color={colors.textMuted} testID="heading-hint">
                  Pick your direction to see the jeepneys coming your way.
                </AppText>
              ) : null}
            </View>
          ) : null}
          <View style={styles.guarantee}>
            <Icon name="check-circle" size={18} color={colors.liveStrong} />
            <AppText variant="bodySm" weight="semibold" color={colors.liveStrong} style={styles.guaranteeText}>
              {ad ? 'Watch to the end to unlock. Watch again any time.' : 'Active vehicle radar guaranteed for 15 mins'}
            </AppText>
          </View>
          <View style={styles.actions}>
            <Button label="Cancel" variant="tonal" flex onPress={onCancel} testID="cancel-track" />
            <Button
              label={ad ? `Watch ad • ${adMinutes} min free` : 'Confirm & Track (₱1)'}
              icon={ad ? 'smart-display' : 'radar'}
              flex
              disabled={needsHeading}
              onPress={onConfirm}
              testID="confirm-track"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
