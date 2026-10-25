import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, PressableScale, BandChip, Screen, StaticWaveform, T } from '@/components/ui';
import { Trends } from '@/components/trends';
import { useAuth } from '@/lib/auth';
import { BANDS } from '@/lib/copy';
import { fmtDate, fmtShort } from '@/lib/format';
import { useResults } from '@/lib/useResults';
import { spacing } from '@/theme';

export default function Home() {
  const router = useRouter();
  const { displayName } = useAuth();
  const { results, failed } = useResults();
  const first = results !== null && results.length === 0;
  const latest = results?.[0];
  const earlier = results?.slice(1, 4) ?? [];

  return (
    <Screen scroll>
      <View style={{ gap: spacing.l, paddingTop: spacing.l }}>
        <View>
          <T v="title" accessibilityRole="header">{displayName ? `Hello, ${displayName}.` : 'Hello.'}</T>
          <T v="bodyLarge" color="textSecondary">{first ? 'Welcome to Voice Check.' : 'Ready when you are.'}</T>
        </View>

        <Card style={{ gap: spacing.m }}>
          <T v="button" accessibilityRole="header">{first ? 'Your first voice check' : 'Start a voice check'}</T>
          <T color="textSecondary" v="bodyLarge" style={{ fontSize: 19 }}>
            {first
              ? 'Eight short tasks, about 2 minutes. Find a quiet spot and hold the phone about 20 cm (8 in) from your mouth.'
              : 'Eight short tasks, about 2 minutes.'}
          </T>
          <Button label={first ? 'Start your first check' : 'Start a voice check'} onPress={() => router.push('/prescreen')} />
        </Card>

        {failed ? (
          <T color="textSecondary">We could not load your past results. Check your connection and come back to this screen.</T>
        ) : null}

        {first ? (
          <View style={{ gap: spacing.xl, paddingTop: spacing.s }}>
            <StaticWaveform stage={84} minBar={8} maxExtra={76} />
            <T color="textSecondary" style={{ textAlign: 'center' }}>Your results will appear here after your first check.</T>
          </View>
        ) : null}

        {latest ? (
          <PressableScale dim onPress={() => router.push(`/result/${latest.id}`)} accessibilityRole="button" accessibilityLabel={`Your latest result, ${fmtShort(latest.createdAt)}: ${latest.band}. Read your result`}>
            <Card style={{ gap: spacing.m, padding: spacing.l }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T v="caption" style={{ fontFamily: 'AtkinsonHyperlegible_700Bold' }} color="textSecondary">Your latest result</T>
                <T v="caption" color="textSecondary">{fmtShort(latest.createdAt)}</T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.l }}>
                <BandChip band={latest.band} big />
                <T color="text" style={{ flex: 1 }}>{BANDS[latest.band].short}</T>
              </View>
              <T color="primaryText" style={{ fontFamily: 'AtkinsonHyperlegible_700Bold', textDecorationLine: 'underline' }}>Read your result</T>
            </Card>
          </PressableScale>
        ) : null}

        {earlier.length ? (
          <View>
            <T v="caption" color="textSecondary" style={{ fontFamily: 'AtkinsonHyperlegible_700Bold', marginBottom: spacing.s }}>Earlier checks</T>
            {earlier.map((r) => (
              <PressableScale key={r.id} dim onPress={() => router.push(`/result/${r.id}`)} accessibilityRole="button" accessibilityLabel={`${fmtDate(r.createdAt)}: ${r.band}`}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 64, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.3)' }}>
                  <T>{fmtDate(r.createdAt)}</T>
                  <BandChip band={r.band} />
                </View>
              </PressableScale>
            ))}
          </View>
        ) : null}

        {results && results.length >= 2 ? <Trends results={results} /> : null}
      </View>
    </Screen>
  );
}
