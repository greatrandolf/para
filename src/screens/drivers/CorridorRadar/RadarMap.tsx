import { View } from 'react-native';

import { colors } from '@/constants/theme';
import type { RadarSnapshot } from '@/types/driver';
import { AppText } from '@packages/ui/AppText';
import { Icon } from '@packages/ui/Icon';
import { IconButton } from '@packages/ui/IconButton';
import { MapCanvas, MapPin } from '@packages/ui/MapCanvas';

import { mapStyles as styles, RADAR_HEIGHT } from './styles';

type Props = { radar: RadarSnapshot };

/** Corridor radar around the driver's own unit (Views only, plan D4). */
export function RadarMap({ radar }: Props) {
  return (
    <MapCanvas height={RADAR_HEIGHT} variant="radar" rounded testID="radar-map" accessibilityLabel="Corridor radar map">
      <View style={styles.headway}>
        <Icon name="social-distance" size={16} color={colors.amberStrong} />
        <AppText variant="labelBadge" weight="bold" color={colors.onSurface}>
          {'Headway: '}
          <AppText variant="labelBadge" weight="bold" color={colors.liveStrong}>
            {radar.headway}
          </AppText>
        </AppText>
      </View>
      <IconButton
        icon="my-location"
        accessibilityLabel="Recenter radar"
        iconColor={colors.ink}
        style={styles.recenter}
        testID="radar-recenter"
      />

      <View style={styles.ahead}>
        <View style={styles.greenDot} />
        <AppText variant="labelBadge" color={colors.onSurface}>
          {radar.ahead.unit}
        </AppText>
        <AppText variant="labelBadge" color={colors.textMuted} numberOfLines={2}>
          {radar.ahead.gap}
        </AppText>
      </View>
      <View style={styles.aheadArrow}>
        <Icon name="arrow-upward" size={16} color={colors.onDark} />
      </View>

      <View style={styles.cluster}>
        <Icon name="group" size={20} color={colors.onBrandAction} />
        <View>
          <AppText variant="labelBadge" weight="bold" color={colors.onBrandAction}>
            {radar.stopCluster.name.toUpperCase()}
          </AppText>
          <AppText variant="headlineMd" weight="extrabold" color={colors.onBrandAction} tabular>
            {radar.stopCluster.pax}
          </AppText>
        </View>
      </View>

      <MapPin x="42%" y={180} variant="self" label={`YOU • ${radar.speed} km/h`} />

      <View style={styles.behindArrow}>
        <Icon name="keyboard-arrow-up" size={18} color={colors.ink} />
      </View>
      <View style={styles.behind}>
        <View style={styles.amberDot} />
        <AppText variant="labelBadge" color={colors.onSurface}>
          {`${radar.behind.unit}  ${radar.behind.gap}`}
        </AppText>
      </View>

      <View style={styles.capitol}>
        <Icon name="hail" size={20} color={colors.amberStrong} />
        <View>
          <AppText variant="labelBadge" weight="bold">
            {radar.nextStopCallout.name}
          </AppText>
          <AppText variant="bodySm" color={colors.textMuted}>
            {radar.nextStopCallout.pax}
          </AppText>
        </View>
      </View>
      <View style={styles.flow}>
        <View style={styles.flowDot} />
        <AppText variant="labelBadge" weight="semibold" color={colors.onSurface}>
          {radar.flow}
        </AppText>
      </View>
    </MapCanvas>
  );
}
