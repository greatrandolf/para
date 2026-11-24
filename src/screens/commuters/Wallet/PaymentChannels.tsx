import { Pressable, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { PaymentChannel, PaymentChannelId } from '@/types/commuter';
import { AppText } from '@packages/ui/AppText';
import { Icon } from '@packages/ui/Icon';

import { channelStyles as styles } from './styles';

type Props = {
  channels: PaymentChannel[];
  selected: PaymentChannelId;
  onSelect: (id: PaymentChannelId) => void;
};

export function PaymentChannels({ channels, selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {channels.map((channel) => {
        const isSelected = channel.id === selected;
        return (
          <Pressable
            key={channel.id}
            testID={`channel-${channel.id}`}
            accessibilityRole="button"
            accessibilityLabel={channel.name}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(channel.id)}
            style={[styles.tile, isSelected && styles.tileSelected]}>
            <View style={styles.iconCircle}>
              <Icon name={channel.icon} size={18} color={isSelected ? colors.brand : colors.onSurface} />
            </View>
            <AppText variant="labelBadge" numberOfLines={1}>
              {channel.name}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
