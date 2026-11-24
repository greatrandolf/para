import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { FUNCTIONS_URL } from '@/constants/api';
import { colors, fontAssets } from '@/constants/theme';
import { SessionProvider } from '@/hooks/useSession';
import { getIdToken } from '@/services/firebase';
// Defines the drivers' background location task at startup, as expo-task-manager requires (driver-background-gps).
import '@/services/liveLocation';
import { QueryProvider } from '@packages/tanstack/query/QueryProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Light-only navigation theme (plan Q4): no dark flash during transitions. */
const navigationTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: colors.canvas,
    card: colors.surfaceCard,
    text: colors.onSurface,
    border: colors.borderSubtle,
    primary: colors.brand,
  },
};

const rootStyle = { flex: 1 } as const;

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  // GestureHandlerRootView: draggable sheets (@packages/ui/BottomSheet) need it at the root.
  return (
    <GestureHandlerRootView style={rootStyle}>
      <QueryProvider functionsUrl={FUNCTIONS_URL} getAuthToken={getIdToken}>
        <SessionProvider>
          <ThemeProvider value={navigationTheme}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(commuters)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(drivers)" options={{ gestureEnabled: false }} />
            </Stack>
          </ThemeProvider>
        </SessionProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
