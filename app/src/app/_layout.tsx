import {
  AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible';
import { Fraunces_500Medium, Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth';
import { AppThemeProvider, useAppTheme } from '@/lib/theme-context';



SplashScreen.preventAutoHideAsync().catch(() => {});

function Routes() {
  const { user, ready, consented } = useAuth();
  const { palette, isDark } = useAppTheme();
  const loading = !ready || (user !== null && consented === null);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  if (loading) return null;

  const signedOut = !user;
  const needsConsent = !!user && consented === false;
  const inApp = !!user && consented === true;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: palette.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={signedOut}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="forgot" />
        </Stack.Protected>
        <Stack.Protected guard={needsConsent}>
          <Stack.Screen name="consent" />
        </Stack.Protected>
        <Stack.Protected guard={needsConsent || inApp}>
          <Stack.Screen name="microphone" />
        </Stack.Protected>
        <Stack.Protected guard={inApp}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="prescreen" />
          <Stack.Screen name="record" options={{ gestureEnabled: false }} />
          <Stack.Screen name="result/[id]" />
          <Stack.Screen name="learn/[topic]" />
          <Stack.Screen name="privacy" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_500Medium, Fraunces_600SemiBold, AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold,
  });
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <AuthProvider>
            <Routes />
          </AuthProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
