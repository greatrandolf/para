import { View } from 'react-native';

import { colors } from '@/constants/theme';
import type { LiveTrip } from '@/types/commuter';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';

import { sheetStyles as styles } from './styles';

type Props = { pass: LiveTrip['pass'] };

/** The live pass card in the Live Map sheet: title, subtitle and status badge. */
export function PassStatusCard({ pass }: Props) {
  return (
    <Card variant="fare" padding="sm" style={styles.pass}>
      <View style={styles.passIcon}>
        <Icon name="verified-user" size={18} color={colors.onAmber} />
      </View>
      <View style={styles.passBody}>
        <AppText variant="labelBadge" weight="bold" color={colors.amberStrong} numberOfLines={2}>
          {pass.title}
        </AppText>
        <AppText variant="bodySm" color={colors.textMuted} numberOfLines={2}>
          {pass.subtitle}
        </AppText>
      </View>
      <Badge label={pass.status} tone="fareSolid" />
    </Card>
  );
}
