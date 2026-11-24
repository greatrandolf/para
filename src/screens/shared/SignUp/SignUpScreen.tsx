import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { authErrorMessage, useSession } from '@/hooks/useSession';
import { AppText } from '@packages/ui/AppText';
import { Button } from '@packages/ui/Button';
import { Icon } from '@packages/ui/Icon';
import { TextField } from '@packages/ui/TextField';

import { GoogleButton } from '../GoogleButton';
import { isEmail } from '../SignIn/SignInScreen';
import { styles } from '../SignIn/styles';

type Values = { name: string; email: string; password: string; confirm: string };

export const MIN_PASSWORD = 8;

/** The same rules the screen shows; Firebase Auth checks again. */
export function validateSignUp(v: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!v.name.trim()) errors.name = 'Enter your name.';
  if (!isEmail(v.email)) errors.email = 'Enter a valid email address.';
  if (v.password.length < MIN_PASSWORD || !/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) {
    errors.password = `At least ${MIN_PASSWORD} characters, with letters and numbers.`;
  }
  if (v.confirm !== v.password) errors.confirm = 'The passwords do not match.';
  return errors;
}

/** Commuters create their own account with email and password. */
export function SignUpScreen() {
  const session = useSession();
  const [values, setValues] = useState<Values>({ name: '', email: '', password: '', confirm: '' });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (session.status === 'commuter') return <Redirect href="/commute" />;

  const errors = validateSignUp(values);
  const shown = submitted ? errors : {};
  const set = (patch: Partial<Values>) => setValues((v) => ({ ...v, ...patch }));

  const submit = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    setBusy(true);
    setError(undefined);
    try {
      await session.signUp(values);
      router.replace('/commute');
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root} testID="screen-sign-up">
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <View style={styles.heading}>
              <AppText variant="headlineMd" accessibilityRole="header">
                Create your account
              </AppText>
              <AppText variant="bodyMd" color={colors.textMuted}>
                For commuters. Drivers get access from their fleet instead.
              </AppText>
            </View>
            <TextField
              label="Full name"
              placeholder="Juan Dela Cruz"
              autoComplete="name"
              textContentType="name"
              value={values.name}
              onChangeText={(name) => set({ name })}
              error={shown.name}
              testID="sign-up-name"
            />
            <TextField
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              value={values.email}
              onChangeText={(email) => set({ email })}
              error={shown.email}
              testID="sign-up-email"
            />
            <TextField
              label="Password"
              password
              autoComplete="new-password"
              textContentType="newPassword"
              hint={`At least ${MIN_PASSWORD} characters, with letters and numbers.`}
              value={values.password}
              onChangeText={(password) => set({ password })}
              error={shown.password}
              testID="sign-up-password"
            />
            <TextField
              label="Confirm password"
              password
              autoComplete="new-password"
              textContentType="newPassword"
              value={values.confirm}
              onChangeText={(confirm) => set({ confirm })}
              onSubmitEditing={() => void submit()}
              error={shown.confirm}
              testID="sign-up-confirm"
            />
            {error ? (
              <View style={styles.error} accessibilityRole="alert" testID="sign-up-error">
                <Icon name="error-outline" size={20} color={colors.error} />
                <AppText variant="bodySm" style={styles.shrink}>
                  {error}
                </AppText>
              </View>
            ) : null}
            <Button
              label={busy ? 'Creating account…' : 'Create account'}
              variant="primary"
              size="lg"
              fullWidth
              disabled={busy}
              onPress={() => void submit()}
              testID="sign-up-submit"
            />
            <GoogleButton onError={setError} />
            <View style={styles.switchRow}>
              <AppText variant="bodyMd" color={colors.textMuted}>
                Already have an account?
              </AppText>
              <Pressable
                accessibilityRole="link"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                hitSlop={8}
                testID="sign-up-sign-in">
                <AppText variant="labelAction" color={colors.brandStrong}>
                  Sign in
                </AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignUpScreen;
