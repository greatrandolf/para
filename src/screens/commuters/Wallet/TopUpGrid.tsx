import { Pressable, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { TopUpPackage } from '@/types/commuter';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Icon } from '@packages/ui/Icon';

import { gridStyles as styles } from './styles';

type Props = {
  packages: TopUpPackage[];
  selected: number;
  onSelect: (amount: number) => void;
};

export function TopUpGrid({ packages, selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {packages.map((pkg) => {
        const isSelected = pkg.amount === selected;
        const emphasis = isSelected ? colors.brandStrong : colors.onSurface;
        return (
          <Pressable
            key={pkg.amount}
            testID={`package-${pkg.amount}`}
            accessibilityRole="button"
            accessibilityLabel={`₱${pkg.amount} ${pkg.views}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(pkg.amount)}
            style={[styles.tile, isSelected && styles.tileSelected]}>
            {pkg.tag ? <Badge label={pkg.tag} tone="fareSolid" style={styles.tag} /> : null}
            <AppText variant="headlineMd" weight="extrabold" color={emphasis} tabular>
              {`₱${pkg.amount}`}
            </AppText>
            <AppText
              variant="bodySm"
              weight={isSelected ? 'bold' : 'regular'}
              color={isSelected ? colors.brandStrong : colors.textMuted}>
              {pkg.views}
            </AppText>
            <View style={styles.perkRow}>
              <Icon name={pkg.perkIcon} size={14} color={colors.liveStrong} />
              <AppText variant="labelBadge" weight="semibold" color={colors.liveStrong}>
                {pkg.perk}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
