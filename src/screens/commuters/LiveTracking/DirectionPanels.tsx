import { View } from 'react-native';

import { colors } from '@/constants/theme';
import type { DirectionUnits, TravelDirection } from '@/types/commuter';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Icon } from '@packages/ui/Icon';

import { panelStyles as styles } from './styles';

type Props = {
  directions: DirectionUnits[];
  /** The tracked direction is highlighted. */
  selected: TravelDirection;
};

/**
 * The two direction panels. As in the light reference: the tracked direction
 * is an orange-tinted panel (`brandTint` + `brand` border, `brandStrong` text)
 * and the other is a light-blue info panel. The tracked unit row is bright
 * orange with a bold white label (W2).
 */
export function DirectionPanels({ directions, selected }: Props) {
  return (
    <View style={styles.row}>
      {directions.map((direction) => {
        const active = direction.id === selected;
        return (
          <View
            key={direction.id}
            testID={`direction-panel-${direction.id}`}
            style={[styles.panel, active ? styles.panelActive : styles.panelIdle]}>
            {/* Mono labels are ~127pt wide: the label wraps to two lines and the unit count
                sits on its own line, instead of squeezing the label to "To…". */}
            <View style={styles.header}>
              <Icon name={direction.icon} size={18} color={active ? colors.brand : colors.secondary} />
              <AppText
                variant="labelBadge"
                weight="bold"
                color={active ? colors.brandStrong : colors.onSurface}
                numberOfLines={2}
                style={styles.headerLabel}>
                {direction.label}
              </AppText>
            </View>
            <Badge label={`${direction.units.length} Units`} tone={active ? 'brandSolid' : 'info'} />
            {direction.units.map((unit) => (
              <View key={unit.id} style={[styles.unit, unit.tracked && styles.unitTracked]}>
                <AppText
                  variant="labelBadge"
                  weight="bold"
                  color={unit.tracked ? colors.onBrandAction : colors.onSurface}
                  numberOfLines={1}
                  style={styles.unitName}>
                  {unit.name}
                </AppText>
                <AppText
                  variant="labelBadge"
                  weight={unit.tracked ? 'bold' : 'semibold'}
                  color={unit.tracked ? colors.onBrandAction : active ? colors.brandStrong : colors.secondary}
                  tabular>
                  {unit.eta}
                </AppText>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}
