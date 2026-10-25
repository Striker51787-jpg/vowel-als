import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Button, Field, MessageBox, NavLabel, Screen, T, TextLink } from '@/components/ui';
import { authMessage, useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme-context';
import { auth as authTokens, spacing } from '@/theme';

function SentCircle() {
  const { palette } = useAppTheme();
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  const t = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: reduce ? 150 : 300, easing: Easing.out(Easing.cubic) });
    t.value = withDelay(reduce ? 0 : 400, withTiming(1, { duration: reduce ? 150 : 200, easing: Easing.out(Easing.cubic) }));
  }, [p, t, reduce]);
  const c = useAnimatedStyle(() => ({ opacity: p.value, transform: reduce ? [] : [{ scale: 0.9 + 0.1 * p.value }] }));
  const tx = useAnimatedStyle(() => ({ opacity: t.value }));
  const d = authTokens.sentCircle;
  return (
    <View style={{ gap: spacing.xl, alignItems: 'flex-start' }}>
      <Animated.View
        accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={[{ width: d.diameter, height: d.diameter, borderRadius: d.diameter / 2, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' }, c]}
      >
        <View style={{ width: d.check.width, height: d.check.height, borderLeftWidth: d.check.border, borderBottomWidth: d.check.border, borderColor: palette.onPrimary, transform: [{ rotate: `${d.check.rotateDeg}deg` }], marginTop: -6 }} />
      </Animated.View>
      <Animated.View style={[{ gap: spacing.m }, tx]}>
        <T v="title" accessibilityRole="header">Check your email.</T>
      </Animated.View>
    </View>
  );
}

export default function Forgot() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.includes('@') || busy) return;
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      // Same message either way, so the screen never reveals whether an account exists.
      if (code === 'auth/user-not-found') setSent(true);
      else setError(authMessage(e, 'reset'));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Screen
        scroll
        footer={
          <>
            <Button label="Back to log in" onPress={() => router.replace('/login')} />
            <TextLink label="Use a different email" onPress={() => setSent(false)} />
          </>
        }
      >
        <View style={{ gap: spacing.xl, paddingTop: spacing.xxxl }}>
          <SentCircle />
          <T v="bodyLarge" color="textSecondary">
            {`If there is an account for ${email.trim()}, a reset link is on its way. It can take a few minutes.`}
          </T>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <>
          <Button label={busy ? 'Sending…' : 'Send reset link'} onPress={submit} disabled={!email.includes('@') || busy} />
          <TextLink label="Back to log in" onPress={() => router.replace('/login')} />
        </>
      }
    >
      <View style={{ gap: spacing.l }}>
        <NavLabel label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} />
        <T v="title">Reset your password</T>
        <T v="bodyLarge" color="textSecondary">Enter the email you signed up with. We will send you a link to choose a new password.</T>
        <MessageBox message={error} />
        <Field
          label="Email" value={email} onChangeText={(t) => { setEmail(t); setError(null); }}
          autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email"
        />
      </View>
    </Screen>
  );
}
