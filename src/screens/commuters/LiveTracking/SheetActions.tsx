import { View } from 'react-native';

import { Button } from '@packages/ui/Button';

import { sheetStyles as styles } from './styles';

type Props = {
  onRefresh: () => void;
  onSwitch: () => void;
};

/** Refresh, Signal Stale and Switch (direction) buttons at the bottom of the Live Map sheet. */
export function SheetActions({ onRefresh, onSwitch }: Props) {
  return (
    <View style={styles.actions}>
      <Button label="Refresh" icon="refresh" variant="tonal" flex size="sm" onPress={onRefresh} testID="refresh-gps" />
      <Button
        label="Signal Stale"
        icon="report"
        variant="danger-soft"
        flex
        size="sm"
        accessibilityLabel="Report signal stale"
        testID="signal-stale"
      />
      <Button label="Switch" icon="swap-calls" flex size="sm" onPress={onSwitch} testID="direction-switch" />
    </View>
  );
}
