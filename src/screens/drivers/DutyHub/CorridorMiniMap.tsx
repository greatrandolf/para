import { View } from 'react-native';

import { colors } from '@/constants/theme';
import type { BroadcastStatus, DirectionInfo } from '@/types/driver';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';
import { MapCanvas, PulseDot, RouteSegment } from '@packages/ui/MapCanvas';
import { SectionHeader } from '@packages/ui/SectionHeader';

import { miniMapStyles as styles, styles as shared } from './styles';

type Props = { direction: DirectionInfo; status: BroadcastStatus };

/** 128px corridor preview; the overlay follows the selected direction. */
export function CorridorMiniMap({ direction, status }: Props) {
  return (
    <Card style={shared.card}>
      <SectionHeader
        title="Route 17B Escario Corridor Live"
        titleVariant="labelTelemetry"
        icon="radar"
        right={<Badge label={status.speed} tone="live" />}
      />
      <MapCanvas height={128} rounded accessibilityLabel="Route 17B corridor preview">
        <RouteSegment x="8%" y={44} length="70%" color={colors.brand} thickness={5} glow />
        <RouteSegment x="78%" y={20} length={29} orientation="vertical" color={colors.amber} thickness={5} />
        <PulseDot x="40%" y={33} size={12} color={colors.brand} ringColor={colors.pulseBrand} />
        <View style={styles.overlay} testID="duty-radar-overlay">
          <Icon name="navigation" size={18} color={colors.brand} />
          <View style={styles.overlayText}>
            <AppText variant="labelBadge" weight="bold" numberOfLines={1}>
              {direction.radarStop}
            </AppText>
            <AppText variant="bodySm" color={colors.textMuted} numberOfLines={1}>
              {status.radarNote}
            </AppText>
          </View>
          <Badge label={direction.radarPax} tone="brandSolid" />
        </View>
      </MapCanvas>
    </Card>
  );
}
