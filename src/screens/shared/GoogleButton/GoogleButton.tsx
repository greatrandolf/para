import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { colors } from '@/constants/theme';
import { authErrorMessage, useSession } from '@/hooks/useSession';
import { EMULATOR_GOOGLE_USER, googleSignInMode } from '@/services/googleSignIn';
import { AppText } from '@packages/ui/AppText';

import { styles } from './styles';

/**
 * "Continue with Google" for commuters, with an "or" divider above it. Hidden when Google sign-in isn't set up in
 * this build. Signing in with Google creates the commuter account on first use.
 */
export function GoogleButton({ onError }: { onError: (message: string | undefined) => void }) {
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const mode = googleSignInMode();
  if (mode === 'unavailable') return null;

  const press = async () => {
    setBusy(true);
    onError(undefined);
    try {
      if (await session.signInWithGoogle()) router.replace('/commute');
    } catch (e) {
      onError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.line} />
        <AppText variant="bodySm" color={colors.textMuted}>
          or
        </AppText>
        <View style={styles.line} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={() => void press()}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        testID="google-sign-in">
        {busy ? (
          <ActivityIndicator color={colors.textMuted} />
        ) : (
          <MaterialCommunityIcons name="google" size={20} color={colors.onSurface} />
        )}
        <AppText variant="labelAction">Continue with Google</AppText>
      </Pressable>
      
    </View>
  );
}
