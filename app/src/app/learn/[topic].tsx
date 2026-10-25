import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { NavLabel, Screen, T } from '@/components/ui';
import { TOPICS } from '@/lib/learn';
import { spacing } from '@/theme';

export default function LearnTopic() {
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const router = useRouter();
  const t = TOPICS.find((x) => x.id === topic);
  return (
    <Screen scroll>
      <View style={{ gap: spacing.l }}>
        <NavLabel label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/learn'))} />
        <T v="title" accessibilityRole="header">{t?.title ?? 'Not found'}</T>
        {t?.sections.map((s, i) => (
          <View key={i} style={{ gap: spacing.s }}>
            {s.heading ? <T v="button" style={{ fontSize: 22 }} accessibilityRole="header">{s.heading}</T> : null}
            <T v="bodyLarge" color="textSecondary">{s.body}</T>
          </View>
        ))}
      </View>
    </Screen>
  );
}
