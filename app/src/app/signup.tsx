import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Checkbox, Field, MessageBox, NavLabel, Screen, T, TextLink } from '@/components/ui';
import { authMessage, useAuth } from '@/lib/auth';
import { spacing } from '@/theme';

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ok = email.includes('@') && password.length >= 8 && agree && !busy;

  const submit = async () => {
    if (!ok) return;
    setBusy(true);
    try {
      await signUp(email, password);
    } catch (e) {
      setError(authMessage(e, 'signup'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        <>
          <Button label={busy ? 'Creating account…' : 'Create account'} onPress={submit} disabled={!ok} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s }}>
            <T color="textSecondary">Already have an account?</T>
            <TextLink label="Log in" onPress={() => router.replace('/login')} />
          </View>
        </>
      }
    >
      <View style={{ gap: spacing.l }}>
        <NavLabel label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
        <T v="title">Create your account</T>
        <MessageBox message={error} />
        <Field
          label="Email" value={email} onChangeText={(t) => { setEmail(t); setError(null); }}
          autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email"
        />
        <Field
          label="Password" secure value={password} onChangeText={(t) => { setPassword(t); setError(null); }}
          helper="At least 8 characters." textContentType="newPassword" autoComplete="new-password"
        />
        <Checkbox
          checked={agree} onChange={setAgree}
          label="I understand Voice Check is a research screening prototype. It is not a diagnosis and not a medical test."
        />
      </View>
    </Screen>
  );
}
