import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { colors } from '../theme';
import { styles } from './styles';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
  testID?: string;
};

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={[styles.track, style]}>
      {options.map((option) => {
        const selected = option.value === value;
        // Reference "To Apas (IT Park)": the selected option is bright orange with a bold white label (W2).
        const color = selected ? colors.onBrandAction : colors.onSurface;
        return (
          <Pressable
            key={option.value}
            testID={option.testID}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.selected]}>
            {option.icon ? <Icon name={option.icon} size={16} color={color} /> : null}
            <AppText variant="labelBadge" weight="bold" color={color} numberOfLines={1} style={styles.label}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
