import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { AppText } from '@packages/ui/AppText';
import { Button } from '@packages/ui/Button';
import { Icon } from '@packages/ui/Icon';

import { styles } from './styles';

/** Only Para activation codes are accepted, so a random QR code is ignored instead of sent to the backend. */
export const looksLikeActivation = (value: string) => /(?:^|code=)[A-Za-z0-9_-]{40,64}$/.test(value.trim());

/**
 * Activate the driver app on this phone: scan the one-time QR code the fleet shows in the portal (or open its
 * `para://activate?code=…` link). The phone then signs in as that driver; no password exists.
 */
export function ActivateDeviceScreen() {
  const session = useSession();
  const params = useLocalSearchParams<{ code?: string }>();
  const linkCode = typeof params.code === 'string' ? params.code : undefined;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [pasting, setPasting] = useState(Platform.OS === 'web');
  const [pasted, setPasted] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const handled = useRef<string | null>(null);

  const activate = async (value: string) => {
    if (busy || handled.current === value) return;
    handled.current = value;
    setScanning(false);
    setBusy(true);
    setError(undefined);
    try {
      await session.activate(value.trim());
      router.replace('/pin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Activation failed. Try again.');
      handled.current = null;
    } finally {
      setBusy(false);
    }
  };

  // Opened from the QR code with the phone's own camera (deep link).
  useEffect(() => {
    // Started from a promise so the effect itself sets no state.
    if (linkCode) void Promise.resolve(linkCode).then(activate);
    // Run once per link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkCode]);

  if (session.status === 'driver' && !linkCode && !busy) {
    return <Redirect href={session.pin === 'unlocked' ? '/duty' : '/pin'} />;
  }

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (looksLikeActivation(data)) void activate(data);
    else setError('That QR code is not a Para activation code.');
  };

  const startScan = async () => {
    setError(undefined);
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setError('Allow camera access to scan, or paste the link instead.');
        return;
      }
    }
    setScanning(true);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root} testID="screen-activate">
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logo}>
              <Icon name="qr-code-scanner" size={34} color={colors.onBrand} />
            </View>
            <AppText variant="headlineLgMobile" accessibilityRole="header" align="center">
              Activate the driver app
            </AppText>
            <AppText variant="bodyMd" color={colors.textMuted} align="center">
              Ask your fleet officer to show your activation code in the Para portal, then scan it here. It works once
              and expires in 15 minutes.
            </AppText>
          </View>

          {session.notice && !error ? (
            <View style={styles.notice} accessibilityRole="alert">
              <Icon name="info" size={20} color={colors.amberStrong} />
              <AppText variant="bodySm" style={styles.shrink}>
                {session.notice}
              </AppText>
            </View>
          ) : null}

          {busy ? (
            <View style={styles.busy}>
              <ActivityIndicator color={colors.brand} />
              <AppText variant="bodyMd" color={colors.textMuted}>
                Activating this phone…
              </AppText>
            </View>
          ) : scanning ? (
            <View style={styles.cameraWrap}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onScanned}
                testID="activate-camera"
              />
              <View pointerEvents="none" style={styles.reticle} />
              <Button label="Cancel" variant="tonal" onPress={() => setScanning(false)} />
            </View>
          ) : (
            <View style={styles.actions}>
              {Platform.OS !== 'web' ? (
                <Button
                  label="Scan activation code"
                  icon="qr-code-scanner"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={() => void startScan()}
                  testID="activate-scan"
                />
              ) : null}
              {pasting ? (
                <View style={styles.paste}>
                  <AppText variant="labelAction">Activation link</AppText>
                  <TextInput
                    value={pasted}
                    onChangeText={setPasted}
                    placeholder="para://activate?code=…"
                    placeholderTextColor={colors.textSubtle}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    accessibilityLabel="Activation link"
                    testID="activate-input"
                    onSubmitEditing={() => looksLikeActivation(pasted) && void activate(pasted)}
                  />
                  <Button
                    label="Activate"
                    variant="primary"
                    fullWidth
                    disabled={!looksLikeActivation(pasted)}
                    onPress={() => void activate(pasted)}
                    testID="activate-submit"
                  />
                </View>
              ) : (
                <Button label="Paste link instead" variant="tonal" fullWidth onPress={() => setPasting(true)} />
              )}
            </View>
          )}

          {error ? (
            <View style={styles.error} accessibilityRole="alert" testID="activate-error">
              <Icon name="error-outline" size={20} color={colors.error} />
              <AppText variant="bodySm" color={colors.onSurface} style={styles.shrink}>
                {error}
              </AppText>
            </View>
          ) : null}

          <Button
            label="Back to sign in"
            variant="tonal"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ActivateDeviceScreen;
