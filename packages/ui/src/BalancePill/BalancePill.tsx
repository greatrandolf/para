import { Pressable, View } from 'react-native';

import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { colors } from '../theme';
import { styles } from './styles';

export type BalancePillProps = {
  /** Pre-formatted amount, e.g. `₱45.00`. */
  amount: string;
  onPress?: () => void;
  /** Smaller neutral pill used in the driver top bar. */
  compact?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export function BalancePill({ amount, onPress, compact, accessibilityLabel, testID }: BalancePillProps) {
  const content = (
    <>
      <Icon
        name="account-balance-wallet"
        size={compact ? 14 : 18}
        color={colors.amberStrong}
      />
      <AppText
        variant={compact ? 'labelBadge' : 'labelTelemetry'}
        weight="bold"
        tabular
        numberOfLines={1}
        color={colors.amberStrong}>
        {amount}
      </AppText>
    </>
  );
  if (!onPress) {
    return (
      <View testID={testID} style={[styles.pill, compact && styles.compact]}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `Wallet balance ${amount}`}
      onPress={onPress}
      testID={testID}
      // 36pt visual height; the slop brings the touch target to 48.
      hitSlop={6}
      style={({ pressed }) => [styles.pill, compact && styles.compact, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}
