import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Checkbox, NavLabel, Screen, SoftNote, T, TextLink } from '@/components/ui';
import { session } from '@/lib/session';
import type { PreScreen } from '@/lib/store';
import { spacing } from '@/theme';

const QUESTIONS: { key: keyof PreScreen; label: string }[] = [
  { key: 'sedatives', label: 'I had alcohol or a sedative in the last 4 hours.' },
  { key: 'soreThroat', label: 'I have a cold, a sore throat or a hoarse voice today.' },
  { key: 'tired', label: 'I am very tired or unwell today.' },
  { key: 'noisyPlace', label: 'I am somewhere noisy right now.' },
];

export default function Prescreen() {
  const router = useRouter();
  const [a, setA] = useState<PreScreen>({ sedatives: false, soreThroat: false, tired: false, noisyPlace: false });
  const any = Object.values(a).some(Boolean);

  const go = () => {
    session.preScreen = a;
    router.replace('/record');
  };

  return (
    <Screen
      scroll
      footer={
        <>
          <Button label="Continue" onPress={go} />
          {any ? <TextLink label="Come back another time" onPress={() => router.back()} /> : null}
        </>
      }
    >
      <View style={{ gap: spacing.l }}>
        <NavLabel label="Back" onPress={() => router.back()} />
        <T v="title" accessibilityRole="header">Before we start</T>
        <T v="bodyLarge" color="textSecondary">Tick anything that applies today. If nothing does, just continue.</T>
        {QUESTIONS.map((q) => (
          <Checkbox key={q.key} checked={a[q.key]} onChange={(v) => setA({ ...a, [q.key]: v })} label={q.label} />
        ))}
        {any ? (
          <SoftNote>
            <T>These things can change how your voice sounds, so this result may be less reliable. You can carry on, or come back on a better day.</T>
          </SoftNote>
        ) : null}
        <T v="caption" color="textSecondary">Find a quiet spot and hold the phone about 20 cm (8 in) from your mouth.</T>
      </View>
    </Screen>
  );
}
