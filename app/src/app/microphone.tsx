import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { MicDisc } from '@/components/mic';
import { Button, NavLabel, Screen, T } from '@/components/ui';
import { spacing } from '@/theme';

export default function Microphone() {
  const router = useRouter();
  const [denied, setDenied] = useState(false);

  const allow = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (granted) router.replace('/home');
    else setDenied(true);
  };

  return (
    <Screen
      scroll
      footer={
        denied ? (
          <>
            <Button label="Open Settings" onPress={() => Linking.openSettings()} />
            <T color="textSecondary" style={{ textAlign: 'center' }}>You need the microphone to take part.</T>
          </>
        ) : (
          <Button label="Allow microphone" onPress={allow} />
        )
      }
    >
      <View style={{ gap: spacing.l }}>
        <NavLabel label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <MicDisc />
        </View>
        <T v="button" color="textSecondary">Last step</T>
        <T v="title" accessibilityRole="header">Allow the microphone</T>
        <T v="bodyLarge" color="textSecondary">
          We use the microphone to record the eight short tasks. Your phone will ask for your OK on the next screen.
        </T>
      </View>
    </Screen>
  );
}
