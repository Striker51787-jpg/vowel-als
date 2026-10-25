import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Checkbox, NavLabel, Screen, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { DATA_HANDLING } from '@/lib/copy';
import { spacing } from '@/theme';

export default function Consent() {
  const router = useRouter();
  const { giveConsent, logOut } = useAuth();
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    await giveConsent();
    router.replace('/microphone');
  };

  return (
    <Screen
      scroll
      footer={<Button label="I agree and continue" onPress={go} disabled={!(a && b) || busy} />}
    >
      <View style={{ gap: spacing.l }}>
        <NavLabel label="Log out" onPress={logOut} />
        <T v="button" color="textSecondary">Before your first check</T>
        <T v="title" accessibilityRole="header">How this works</T>
        <Card style={{ borderRadius: 20, padding: 16, gap: 10 }}>
          <T v="button" style={{ fontSize: 21 }}>What it is</T>
          <T v="caption" color="textSecondary">A short voice screening for a high-school research project. Eight tasks, about 2 minutes.</T>
        </Card>
        <Card style={{ borderRadius: 20, padding: 16, gap: 10 }}>
          <T v="button" style={{ fontSize: 21 }}>What it is not</T>
          <T v="caption" color="textSecondary">Not a diagnosis. It cannot tell you whether you have any condition.</T>
        </Card>
        <Card style={{ borderRadius: 20, padding: 16, gap: 10 }}>
          <T v="button" style={{ fontSize: 21 }}>Your voice and your data</T>
          <T v="caption" color="textSecondary">{DATA_HANDLING}</T>
        </Card>
        <Checkbox checked={a} onChange={setA} label="I understand this is not a diagnosis." />
        <Checkbox checked={b} onChange={setB} label="I agree to take part in this research. I can stop at any time." />
      </View>
    </Screen>
  );
}
