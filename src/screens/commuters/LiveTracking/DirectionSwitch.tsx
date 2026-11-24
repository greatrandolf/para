import { Pressable, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { DirectionKey } from '@packages/tanstack/query/routes';
import { AppText } from '@packages/ui/AppText';

import { directionSwitchStyles as styles } from './styles';

type Props = {
  /** The selected route's two directions, e.g. "Going to Legaspi St" / "Going back to Cofta Mouldings Corporation". */
  options: readonly { key: DirectionKey; label: string }[];
  /** None until the commuter picks one (the ₱1 drawer asks too until then). */
  selected?: DirectionKey;
  onSelect: (key: DirectionKey) => void;
};

/**
 * direction-switch: "Going to" or "Going back" on the selected route, under the route chips. The picked direction is
 * the orange lane on the map and the way the ₱1 is shared (with a waiting pin too).
 */
export function DirectionSwitch({ options, selected, onSelect }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel="Where are you going?"
      testID="direction-picker">
      {options.map((o) => {
        const on = o.key === selected;
        return (
          <Pressable
            key={o.key}
            testID={`direction-${o.key}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.label}
            onPress={() => onSelect(o.key)}
            style={[styles.option, on && styles.optionOn]}>
            <View style={[styles.dot, on && styles.dotOn]} />
            <AppText
              variant="bodySm"
              weight={on ? 'bold' : 'semibold'}
              color={on ? colors.brandStrong : colors.onSurface}
              style={styles.label}
              numberOfLines={2}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
