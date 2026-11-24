import { View } from 'react-native';

import { colors } from '@/constants/theme';
import { AppText } from '@packages/ui/AppText';
import { Icon } from '@packages/ui/Icon';

import { sheetStyles as styles } from './styles';

type Props = {
  /** When the last GPS fix arrived, e.g. "4s ago". */
  lastGps: string;
  accuracyNote: string;
};

/** "Last GPS: 4s ago • ±3 m" row with the VERIFIED RTK tag (Live Map sheet). */
export function GpsStatusRow({ lastGps, accuracyNote }: Props) {
  return (
    <View style={styles.gpsRow}>
      <Icon name="satellite-alt" size={18} color={colors.liveStrong} />
      <View style={styles.gpsText}>
        <AppText variant="bodySm" color={colors.textMuted} testID="last-gps">
          {'Last GPS: '}
          <AppText variant="bodySm" weight="bold" color={colors.onSurface}>
            {lastGps}
          </AppText>
        </AppText>
        <AppText variant="bodySm" color={colors.textMuted}>
          {accuracyNote}
        </AppText>
      </View>
      <AppText variant="labelBadge" weight="semibold" color={colors.liveStrong}>
        VERIFIED RTK
      </AppText>
    </View>
  );
}
