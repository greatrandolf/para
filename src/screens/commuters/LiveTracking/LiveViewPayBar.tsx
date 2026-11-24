import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import { colors } from '@/constants/theme';
import type { LiveViewAction } from '@/hooks/liveViewAction';
import { LIVE_PASS_FARE } from '@/hooks/useLivePass';
import { AppText } from '@packages/ui/AppText';
import { Button } from '@packages/ui/Button';

import { chipStyles as styles } from './styles';

type Props = {
  /** What unlocks live jeepneys now: pay ₱1, watch an ad, top up, or nothing to pay for. */
  action: LiveViewAction;
  routeCode: string;
  /** A rewarded ad is playing or being confirmed. */
  watchingAd?: boolean;
  /** Opens the confirm drawer (pay or watch). */
  onView: () => void;
  onTopUp: () => void;
  /** The bar's size, so the minimized sheet keeps the route list above it. */
  onLayout?: (e: LayoutChangeEvent) => void;
};

/**
 * The floating "View live jeepneys" button over the bottom of the Live Map sheet (Revision 11,
 * ad-supported-live-view). Under ₱1 it offers an ad, with only a small top-up link, never a pop-up.
 */
export function LiveViewPayBar({ action, routeCode, watchingAd, onView, onTopUp, onLayout }: Props) {
  return (
    <View style={styles.payBar} pointerEvents="box-none" onLayout={onLayout}>
      {action === 'pay' ? (
        <Button
          label={`View live jeepneys (₱${LIVE_PASS_FARE})`}
          icon="directions-bus"
          size="lg"
          fullWidth
          onPress={onView}
          accessibilityLabel={`View live jeepneys on Route ${routeCode} for ₱${LIVE_PASS_FARE}`}
          testID="pay-live-view"
        />
      ) : action === 'ad' ? (
        <>
          <Button
            // A running Para Ad is shown first, else a Google ad (the backend picks).
            label={watchingAd ? 'Unlocking…' : 'Watch Ad'}
            icon="smart-display"
            size="lg"
            fullWidth
            disabled={watchingAd}
            onPress={onView}
            accessibilityLabel={`View live jeepneys on Route ${routeCode} by watching an ad`}
            testID="pay-live-view"
          />
          <Pressable accessibilityRole="link" onPress={onTopUp} style={styles.payLink} testID="top-up-link">
            <AppText variant="labelBadge" color={colors.brandStrong} align="center">
              {`Top up ₱${LIVE_PASS_FARE} • no ads`}
            </AppText>
          </Pressable>
        </>
      ) : action === 'topup' ? (
        <Button
          label="Top up to view live"
          icon="account-balance-wallet"
          size="lg"
          fullWidth
          onPress={onTopUp}
          testID="pay-live-view"
        />
      ) : (
        // The ₱0 guarantee: nothing to pay for while no jeepney is live on the route.
        <Button label="No live jeepneys (₱0)" icon="lock" size="lg" fullWidth disabled testID="pay-live-view" />
      )}
    </View>
  );
}
