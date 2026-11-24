import { View } from 'react-native';

import { AppText } from '../AppText';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Icon, type IconName } from '../Icon';
import { colors } from '../theme';
import { styles } from './styles';

export type ComingSoonProps = {
  icon: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTestID?: string;
  /** Icon on the action button (default: swap-horiz). */
  actionIcon?: IconName;
};

/** Placeholder for navigation tabs that have no design yet (plan D8). */
export function ComingSoon({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTestID,
  actionIcon = 'swap-horiz',
}: ComingSoonProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={36} color={colors.brand} />
      </View>
      <AppText variant="headlineMd" align="center" accessibilityRole="header">
        {title}
      </AppText>
      <Badge label="Coming soon" tone="fare" dot size="md" style={styles.badge} testID="coming-soon-badge" />
      <AppText variant="bodyMd" color={colors.textMuted} align="center">
        {description}
      </AppText>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="tonal"
          icon={actionIcon}
          testID={actionTestID}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}
