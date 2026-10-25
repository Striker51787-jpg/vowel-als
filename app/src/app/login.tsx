import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Field, LogoMark, MessageBox, Screen, T, TextLink } from '@/components/ui';
import { authMessage, useAuth } from '@/lib/auth';
import { spacing } from '@/theme';

export default function Login() {
  const router = useRouter();
  const { logIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logIn(email, password);
    } catch (e) {
      setError(authMessage(e, 'login'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        <>
          <Button label={busy ? 'Logging in…' : 'Log in'} onPress={submit} disabled={!email || !password || busy} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s }}>
            <T color="textSecondary">New here?</T>
            <TextLink label="Create an account" onPress={() => router.replace('/signup')} />
          </View>
        </>
      }
    >
      <View style={{ gap: spacing.l, paddingTop: spacing.l }}>
        <LogoMark />
        <T v="title">Welcome back.</T>
        <T v="bodyLarge" color="textSecondary">Log in to continue your voice checks.</T>
        <MessageBox message={error} />
        <Field
          label="Email" value={email} onChangeText={(t) => { setEmail(t); setError(null); }}
          autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email"
        />
        <Field
          label="Password" secure value={password} onChangeText={(t) => { setPassword(t); setError(null); }}
          errorBorder={!!error} textContentType="password" autoComplete="current-password" onSubmitEditing={submit}
        />
        <TextLink label="Forgot your password?" align="flex-start" v="body" onPress={() => router.push('/forgot')} />
      </View>
    </Screen>
  );
}
