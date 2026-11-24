import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../AppText';
import { Badge } from '../Badge';
import { BalancePill } from '../BalancePill';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { colors } from '../theme';
import { styles } from './styles';

type BrandProps = {
  variant: 'brand';
  title?: string;
  /** Small uppercase line under the title, e.g. `COMMUTE`. */
  subtitle: string;
  right?: ReactNode;
};

type DriverProps = {
  /** Compact driver header used on Earnings, Radar and Profile (plan Q3). */
  variant: 'driver';
  driverId: string;
  driverName: string;
  statusLabel: string;
  balance: string;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
};

type CustomProps = {
  variant: 'custom';
  left: ReactNode;
  right?: ReactNode;
};

export type TopBarProps = (BrandProps | DriverProps | CustomProps) & { testID?: string };

function BrandMark({ title = 'Para Live', subtitle }: { title?: string; subtitle: string }) {
  return (
    <>
      <View style={styles.logo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Icon name="directions-bus" size={20} color={colors.onBrand} />
      </View>
      <View style={styles.brandText}>
        <View style={styles.titleRow}>
          <AppText variant="headlineSm" weight="bold" numberOfLines={1} style={styles.title} accessibilityRole="header">
            {title}
          </AppText>
          <View style={styles.liveDot} />
        </View>
        <AppText variant="labelBadge" color={colors.textMuted} uppercase numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
    </>
  );
}

function DriverHeader(props: DriverProps) {
  return (
    <View style={styles.brandText}>
      <View style={styles.driverLine}>
        <AppText variant="labelBadge" weight="bold" color={colors.brandStrong}>
          {props.driverId}
        </AppText>
        <AppText variant="labelBadge" color={colors.textMuted}>
          •
        </AppText>
        <AppText variant="headlineSm" numberOfLines={1} style={styles.title}>
          {props.driverName}
        </AppText>
      </View>
      <View style={styles.driverChips}>
        <Badge label={props.statusLabel} tone="live" dot />
        <BalancePill amount={props.balance} compact />
      </View>
    </View>
  );
}

/** Screen header. Applies the top safe-area inset. */
export function TopBar(props: TopBarProps) {
  const insets = useSafeAreaInsets();
  let left: ReactNode;
  let right: ReactNode = null;
  if (props.variant === 'brand') {
    left = <BrandMark title={props.title} subtitle={props.subtitle} />;
    right = props.right;
  } else if (props.variant === 'driver') {
    left = <DriverHeader {...props} />;
    right = (
      <>
        <IconButton
          icon="notifications"
          variant="tonal"
          accessibilityLabel="Notifications"
          onPress={props.onNotificationsPress}
        />
        <IconButton icon="person" variant="brand" accessibilityLabel="Driver profile" onPress={props.onProfilePress} />
      </>
    );
  } else {
    left = props.left;
    right = props.right;
  }
  return (
    <View testID={props.testID} style={[styles.bar, { paddingTop: insets.top + 6 }]}>
      <View style={styles.row}>
        <View style={styles.left}>{left}</View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}
