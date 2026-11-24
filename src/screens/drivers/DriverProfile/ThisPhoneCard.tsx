import { router } from 'expo-router';
import { View } from 'react-native';

import { colors } from '@/constants/theme';
import { AppText } from '@packages/ui/AppText';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';

import { styles } from './styles';

/**
 * The phone's app access: change the PIN. There is no sign-out here: a driver ends the day with End Shift, which
 * locks the app behind the PIN. Only the fleet turning access off (or a new activation) signs the phone out.
 */
export function ThisPhoneCard() {
  return (
    <Card style={styles.card} testID="this-phone">
      <View style={styles.phoneHead}>
        <Icon name="smartphone" size={20} color={colors.brand} />
        <AppText variant="headlineSm" weight="bold" accessibilityRole="header">
          This phone
        </AppText>
      </View>
      <AppText variant="bodySm" color={colors.textMuted}>
        Para is activated on this phone with your PIN. End your day with End Shift below. To use another phone, ask your
        fleet for a new code; this one is then signed out.
      </AppText>
      <View style={styles.phoneActions}>
        <Button
          label="Change PIN"
          icon="pin"
          variant="tonal"
          flex
          onPress={() => router.navigate({ pathname: '/pin', params: { change: '1' } })}
          testID="change-pin"
        />
      </View>
    </Card>
  );
}
