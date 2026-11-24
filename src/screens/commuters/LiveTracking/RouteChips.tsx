import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import { colors } from '@/constants/theme';
import { AppText } from '@packages/ui/AppText';

import { chipStyles as styles } from './styles';

type Props = {
  codes: string[];
  selectedCode?: string;
  onSelect: (code: string) => void;
  /** Shown instead of the chips when there are none (loading, error), or under them (the nearest routes are far). */
  notice?: string;
  /** Reports the list's size, so the minimized sheet can stop just under it (any screen or text size). */
  onLayout?: (e: LayoutChangeEvent) => void;
};

/**
 * Revision 11, the free view: the routes on the commuter's way as orange code chips. Selecting one draws it on the
 * map; its live jeepneys need a ₱1 pass.
 */
export function RouteChips({ codes, selectedCode, onSelect, notice, onLayout }: Props) {
  return (
    <View style={styles.wrap} testID="route-chips" onLayout={onLayout}>
      <AppText variant="headlineSm" accessibilityRole="header">
        Routes on your way
      </AppText>
      <AppText variant="bodySm" color={colors.textMuted}>
        See any route for free. Pay ₱1 to see its live jeepneys for 15 minutes.
      </AppText>
      {codes.length === 0 ? (
        notice ? (
          <AppText variant="bodySm" color={colors.textMuted} testID="route-chips-notice">
            {notice}
          </AppText>
        ) : null
      ) : (
        <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Routes">
          {codes.map((code) => {
            const checked = code === selectedCode;
            return (
              <Pressable
                key={code}
                testID={`route-chip-${code}`}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
                accessibilityLabel={`Route ${code}`}
                onPress={() => onSelect(code)}
                style={[styles.chip, checked && styles.chipSelected]}>
                <AppText
                  variant="labelTelemetry"
                  weight="bold"
                  color={checked ? colors.onBrandAction : colors.brandStrong}>
                  {code}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}
      {codes.length > 0 && notice ? (
        <AppText variant="bodySm" color={colors.textMuted} testID="route-chips-notice">
          {notice}
        </AppText>
      ) : null}
    </View>
  );
}
