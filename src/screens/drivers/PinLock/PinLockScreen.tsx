import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { PIN_LENGTH } from '@/services/pinStore';
import { AppText } from '@packages/ui/AppText';
import { Button } from '@packages/ui/Button';
import { Icon } from '@packages/ui/Icon';

import { styles } from './styles';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

/**
 * The phone's 6-digit PIN: set (twice) right after activation, then asked whenever the app opens.
 * `?change=1` sets a new PIN while unlocked.
 */
export function PinLockScreen() {
  const session = useSession();
  const { change } = useLocalSearchParams<{ change?: string }>();
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (session.status === 'loading') return null;
  if (session.status === 'signedOut') return <Redirect href="/" />;
  if (session.status === 'commuter') return <Redirect href="/commute" />;
  const changing = change === '1' && session.pin === 'unlocked';
  if (session.pin === 'unlocked' && !changing) return <Redirect href="/duty" />;

  const creating = session.pin === 'setup' || changing;
  const name = session.user.displayName?.split(' ')[0];
  const title = creating
    ? first
      ? 'Enter the PIN again'
      : changing
        ? 'Choose a new PIN'
        : 'Set a PIN for this phone'
    : `Welcome back${name ? `, ${name}` : ''}`;
  const subtitle = creating
    ? 'You will enter it each time you open Para. Don’t share it.'
    : 'Enter your 6-digit PIN to open Para.';

  const submit = async (value: string) => {
    setBusy(true);
    try {
      if (creating) {
        if (!first) {
          setFirst(value);
          setMessage(undefined);
        } else if (value !== first) {
          setFirst(undefined);
          setMessage('The PINs did not match. Choose a PIN again.');
        } else {
          await session.createPin(value);
          router.replace('/duty');
        }
      } else {
        const result = await session.unlock(value);
        if (result.ok) router.replace('/duty');
        else if (result.attemptsLeft > 0) {
          setMessage(`Wrong PIN. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.`);
        }
      }
    } finally {
      setPin('');
      setBusy(false);
    }
  };

  const press = (key: (typeof KEYS)[number]) => {
    if (busy || !key) return;
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = (pin + key).slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) void submit(next);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root} testID="screen-pin">
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Icon name={creating ? 'pin' : 'lock'} size={30} color={colors.onBrand} />
          </View>
          <AppText variant="headlineLgMobile" accessibilityRole="header" align="center" testID="pin-title">
            {title}
          </AppText>
          <AppText variant="bodyMd" color={colors.textMuted} align="center">
            {subtitle}
          </AppText>
        </View>

        <View
          style={styles.dots}
          accessible
          accessibilityLabel={`${pin.length} of ${PIN_LENGTH} digits entered`}
          testID="pin-dots">
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
          ))}
        </View>

        <View style={styles.messageRow}>
          {busy ? (
            <ActivityIndicator color={colors.brand} />
          ) : message ? (
            <AppText
              variant="bodySm"
              color={colors.error}
              align="center"
              accessibilityRole="alert"
              testID="pin-message">
              {message}
            </AppText>
          ) : null}
        </View>

        <View style={styles.pad}>
          {KEYS.map((key, i) =>
            key ? (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === 'del' ? 'Delete digit' : key}
                onPress={() => press(key)}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                testID={`pin-key-${key}`}>
                {key === 'del' ? (
                  <Icon name="backspace" size={24} color={colors.onSurface} />
                ) : (
                  <AppText variant="headlineMd">{key}</AppText>
                )}
              </Pressable>
            ) : (
              <View key={`blank-${i}`} style={styles.keyBlank} />
            ),
          )}
        </View>

        {changing ? (
          <Button label="Cancel" variant="tonal" onPress={() => router.back()} />
        ) : !creating ? (
          <Button
            label="Forgot PIN? Sign out of this phone"
            variant="tonal"
            onPress={() => void session.signOutPhone('Signed out. Ask your fleet for a new activation code.')}
            testID="pin-forgot"
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export default PinLockScreen;
