import { Redirect, router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { authErrorMessage, useSession } from '@/hooks/useSession';
import { AppText } from '@packages/ui/AppText';
import { Button } from '@packages/ui/Button';
import { Icon } from '@packages/ui/Icon';
import { TextField } from '@packages/ui/TextField';

import { GoogleButton } from '../GoogleButton';
import { styles } from './styles';

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * The app's first screen: commuters sign in with email and password. Drivers activate this phone with the code
 * from their fleet (link at the bottom); an activated phone skips this screen and asks for the driver's PIN.
 */
export function SignInScreen() {
  const session = useSession();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();

  if (session.status === 'loading') return null;
  if (session.status === 'commuter') return <Redirect href="/commute" />;
  if (session.status === 'driver') return <Redirect href="/pin" />;

  const emailError = submitted && !isEmail(email) ? 'Enter a valid email address.' : undefined;
  const passwordError = submitted && !password ? 'Enter your password.' : undefined;

  const submit = async () => {
    setSubmitted(true);
    setInfo(undefined);
    if (!isEmail(email) || !password) return;
    setBusy(true);
    setError(undefined);
    try {
      await session.signIn(email, password);
      router.replace('/commute');
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError(undefined);
    if (!isEmail(email)) {
      setSubmitted(true);
      setInfo('Enter your email above, then tap “Forgot password?” again.');
      return;
    }
    try {
      await session.resetPassword(email);
      setInfo(`If ${email.trim()} has an account, a reset link is on its way.`);
    } catch (e) {
      setError(authErrorMessage(e));
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root} testID="screen-sign-in">
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Icon name="directions-bus" size={38} color={colors.onBrand} />
            </View>
            
          </View>

          <View style={styles.form} testID="sign-in-card">
            <View style={styles.heading}>
              <AppText variant="headlineMd">Sign in</AppText>
              <AppText variant="bodyMd" color={colors.textMuted}>
                Track jeepneys live and pay per view.
              </AppText>
            </View>
            <TextField
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={emailError}
              testID="sign-in-email"
            />
            <TextField
              ref={passwordRef}
              label="Password"
              password
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={() => void submit()}
              error={passwordError}
              testID="sign-in-password"
            />
            <Pressable
              accessibilityRole="link"
              onPress={() => void forgot()}
              style={styles.forgot}
              hitSlop={8}
              testID="sign-in-forgot">
              <AppText variant="labelAction" color={colors.brandStrong}>
                Forgot password?
              </AppText>
            </Pressable>

            {error ? (
              <View style={styles.error} accessibilityRole="alert" testID="sign-in-error">
                <Icon name="error-outline" size={20} color={colors.error} />
                <AppText variant="bodySm" style={styles.shrink}>
                  {error}
                </AppText>
              </View>
            ) : info ? (
              <AppText variant="bodySm" color={colors.textMuted} testID="sign-in-info">
                {info}
              </AppText>
            ) : session.notice ? (
              // Why this phone was signed out (e.g. the driver was activated on another phone).
              <View style={styles.notice} accessibilityRole="alert" testID="sign-in-notice">
                <Icon name="info" size={20} color={colors.amberStrong} />
                <AppText variant="bodySm" style={styles.shrink}>
                  {session.notice}
                </AppText>
              </View>
            ) : null}

            <Button
              label={busy ? 'Signing in…' : 'Sign in'}
              variant="primary"
              size="lg"
              fullWidth
              disabled={busy}
              onPress={() => void submit()}
              testID="sign-in-submit"
            />
            <GoogleButton onError={setError} />
            <View style={styles.switchRow}>
              <AppText variant="bodyMd" color={colors.textMuted}>
                New to Para?
              </AppText>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/sign-up')}
                hitSlop={8}
                testID="sign-in-create">
                <AppText variant="labelAction" color={colors.brandStrong}>
                  Create an account
                </AppText>
              </Pressable>
            </View>
          </View>

          <View style={styles.driverRow}>
            <Icon name="badge" size={18} color={colors.textMuted} />
            <AppText variant="bodySm" color={colors.textMuted}>
              Are you a driver?
            </AppText>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/activate')}
              hitSlop={8}
              testID="activate-driver-link">
              <AppText variant="labelAction" color={colors.brandStrong} style={styles.link}>
                Activate driver account
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignInScreen;
