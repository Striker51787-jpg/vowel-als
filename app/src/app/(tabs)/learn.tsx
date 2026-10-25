import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { PressableScale, Screen, T } from '@/components/ui';
import { TOPICS } from '@/lib/learn';
import { useAppTheme } from '@/lib/theme-context';
import { spacing, step5 } from '@/theme';

export default function Learn() {
  const router = useRouter();
  const { palette } = useAppTheme();
  return (
    <Screen scroll>
      <View style={{ gap: spacing.l, paddingTop: spacing.l }}>
        <View>
          <T v="title" accessibilityRole="header">Learn</T>
          <T v="bodyLarge" color="textSecondary">Short, plain answers.</T>
        </View>
        {TOPICS.map((t) => (
          <PressableScale
            key={t.id} dim onPress={() => router.push(`/learn/${t.id}`)}
            accessibilityRole="button" accessibilityLabel={`${t.title}. ${t.blurb}`}
          >
            <View
              style={{
                backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: step5.learnCard.radius,
                paddingVertical: step5.learnCard.paddingV, paddingHorizontal: step5.learnCard.paddingH, gap: 4,
              }}
            >
              <T v="button" style={{ fontSize: 21 }}>{t.title}</T>
              <T v="caption" color="textSecondary">{t.blurb}</T>
            </View>
          </PressableScale>
        ))}
      </View>
    </Screen>
  );
}
