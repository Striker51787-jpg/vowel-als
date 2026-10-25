import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { BandChip, PressableScale, Screen, T } from '@/components/ui';
import { useAppTheme } from '@/lib/theme-context';
import { fmtDate } from '@/lib/format';
import { useResults } from '@/lib/useResults';
import { spacing, step5 } from '@/theme';

export default function Results() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { results, failed } = useResults();
  return (
    <Screen scroll>
      <View style={{ gap: spacing.l, paddingTop: spacing.l }}>
        <View>
          <T v="title" accessibilityRole="header">Your results</T>
          <T v="bodyLarge" color="textSecondary">{results?.length ? 'Tap a result to read it again.' : 'Your results will appear here after your first check.'}</T>
        </View>
        {failed ? <T color="textSecondary">We could not load your results. Check your connection and try again.</T> : null}
        <View style={{ gap: step5.listRow.gap }}>
          {results?.map((r) => (
            <PressableScale
              key={r.id} dim onPress={() => router.push(`/result/${r.id}`)}
              accessibilityRole="button" accessibilityLabel={`${fmtDate(r.createdAt)}, 8 of 8 tasks, ${r.band}`}
            >
              <View
                style={{
                  minHeight: step5.listRow.minHeight, borderRadius: step5.listRow.radius, backgroundColor: palette.surface,
                  borderColor: palette.border, borderWidth: 1, paddingHorizontal: spacing.l, paddingVertical: spacing.m,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <View>
                  <T style={{ fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{fmtDate(r.createdAt)}</T>
                  <T v="caption" color="textSecondary">8 of 8 tasks</T>
                </View>
                <BandChip band={r.band} />
              </View>
            </PressableScale>
          ))}
        </View>
      </View>
    </Screen>
  );
}
