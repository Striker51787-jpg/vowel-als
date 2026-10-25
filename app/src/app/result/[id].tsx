import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, findNodeHandle, ScrollView, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BandChip, Button, NavLabel, SoftNote, T, TextLink } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { ALS_ASSOCIATION_URL, BANDS } from '@/lib/copy';
import { fmtDate } from '@/lib/format';
import { exportSummary } from '@/lib/pdf';
import { getResult, type TestRecord } from '@/lib/store';
import { TASKS } from '@/lib/tasks';
import { useAppTheme } from '@/lib/theme-context';
import { result as R, spacing } from '@/theme';

/** Opacity-only reveal (no scale, slide, sound or haptic). Reduce Motion: shown at once. */
function Reveal({ delay, duration, on, children }: { delay: number; duration: number; on: boolean; children: ReactNode }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(on && !reduce ? 0 : 1);
  useEffect(() => {
    if (on && !reduce) p.value = withDelay(delay, withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }));
  }, [on, reduce, delay, duration, p]);
  const a = useAnimatedStyle(() => ({ opacity: p.value }));
  return <Animated.View style={a}>{children}</Animated.View>;
}

export default function Result() {
  const { id, reveal } = useLocalSearchParams<{ id: string; reveal?: string }>();
  const router = useRouter();
  const { user, displayName } = useAuth();
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [rec, setRec] = useState<TestRecord | null>(null);
  const [missing, setMissing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const cardRef = useRef<any>(null);
  const isNew = reveal === '1';

  useEffect(() => {
    if (!user || !id) return;
    getResult(user.uid, id).then((r) => (r ? setRec(r) : setMissing(true))).catch(() => setMissing(true));
  }, [user, id]);

  useEffect(() => {
    if (!rec || !cardRef.current) return;
    const h = findNodeHandle(cardRef.current);
    if (h) setTimeout(() => AccessibilityInfo.setAccessibilityFocus(h), 400);
  }, [rec]);

  const leave = () => (router.canGoBack() && !isNew ? router.back() : router.replace('/home'));

  if (missing || !rec) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.m, paddingHorizontal: R.paddingH, gap: spacing.l }}>
        <NavLabel label={isNew ? 'Done' : 'Back'} onPress={leave} />
        <T v="bodyLarge" color="textSecondary">{missing ? 'We could not find that result.' : 'Loading your result…'}</T>
      </View>
    );
  }

  const band = rec.band;
  const c = palette.band[band];
  const copy = BANDS[band];
  const title = isNew ? `Your result, ${fmtDate(rec.createdAt)}` : `Check of ${fmtDate(rec.createdAt)}`;
  const names: ('low' | 'borderline' | 'elevated')[] = ['low', 'borderline', 'elevated'];
  const flagged = Object.keys(rec.qualityWarnings).length;

  const save = async () => {
    setPreparing(true);
    try { await exportSummary(rec, displayName); } finally { setPreparing(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingTop: insets.top + spacing.s, paddingHorizontal: R.paddingH, height: R.headerHeight + insets.top + spacing.s, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {isNew ? <T v="headerLabel" accessibilityRole="header">{title}</T> : <NavLabel label="Back" onPress={leave} />}
        {isNew ? <NavLabel label="Done" onPress={leave} side="right" /> : null}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: R.paddingH, paddingTop: spacing.s, paddingBottom: spacing.xl, gap: R.gap }}>
        {!isNew ? <T v="headerLabel" accessibilityRole="header">{title}</T> : null}

        <Reveal delay={0} duration={R.reveal.band.duration} on={isNew}>
          <View
            ref={cardRef} accessible accessibilityLabel={`Your result: ${band[0].toUpperCase() + band.slice(1)}. ${copy.headline}`}
            style={{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: R.bandCard.border, borderRadius: R.bandCard.radius, paddingVertical: R.bandCard.paddingV, paddingHorizontal: R.bandCard.paddingH, gap: spacing.m }}
          >
            <BandChip band={band} big />
            <T v="bodyLarge" style={{ fontSize: R.headline.fontSize, lineHeight: R.headline.lineHeight }}>{copy.headline}</T>
          </View>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ marginTop: spacing.s }}>
            <View style={{ flexDirection: 'row', gap: R.scale.gap }}>
              {names.map((n) => {
                const active = n === band;
                const col = palette.band[n];
                return (
                  <View key={n} style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ height: R.scale.pointer.height + 2, justifyContent: 'flex-end' }}>
                      {active ? <View style={{ width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: palette.text }} /> : null}
                    </View>
                    <View style={{ width: '100%', height: R.scale.cellHeight, borderRadius: R.scale.cellRadius, backgroundColor: col.bg, borderWidth: active ? R.scale.activeBorder : 0, borderColor: palette.text, alignItems: 'center', justifyContent: 'center' }}>
                      <T v="button" style={{ color: col.ink, fontSize: 19 }} numberOfLines={1} adjustsFontSizeToFit>{n[0].toUpperCase() + n.slice(1)}</T>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </Reveal>

        <Reveal delay={R.reveal.meaning.delay} duration={R.reveal.meaning.duration} on={isNew}>
          <View style={{ gap: spacing.s }}>
            <T v="title" style={{ fontSize: R.meaning.title.fontSize, lineHeight: R.meaning.title.lineHeight }} accessibilityRole="header">What this means</T>
            <T color="textSecondary" style={{ lineHeight: R.meaning.body.lineHeight }}>{copy.means}</T>
          </View>
        </Reveal>

        <Reveal delay={R.reveal.nextStep.delay} duration={R.reveal.nextStep.duration} on={isNew}>
          <View style={{ gap: R.gap }}>
            <View style={{ backgroundColor: palette.soft, borderRadius: R.nextStepCard.radius, paddingVertical: R.nextStepCard.paddingV, paddingHorizontal: R.nextStepCard.paddingH, gap: spacing.xs }}>
              <T v="button" style={{ fontSize: 21 }}>Your next step</T>
              <T>{copy.next}</T>
            </View>

            <View style={{ gap: spacing.s }}>
              <T v="button" style={{ fontSize: 21 }} accessibilityRole="header">Your eight tasks</T>
              {TASKS.map((t, i) => {
                const warn = rec.qualityWarnings[t.key];
                return (
                  <View key={t.key} style={{ paddingVertical: spacing.s, borderBottomWidth: 1, borderBottomColor: palette.border, gap: 2 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <T v="caption" color="text">{`${i + 1}. ${t.pdfName}`}</T>
                      <T v="caption" color="textSecondary">{warn ? 'Worth redoing' : 'Clear'}</T>
                    </View>
                    {warn ? <T v="caption" color="textSecondary">{warn}</T> : null}
                  </View>
                );
              })}
              {flagged ? (
                <T v="caption" color="textSecondary">
                  Some recordings were not as clear as they could be, which can affect the result. A fresh check in a quiet room may look different.
                </T>
              ) : null}
            </View>

            <SoftNote style={{ gap: spacing.s }}>
              <T v="button" style={{ fontSize: 20 }}>What this does and does not mean</T>
              <T v="caption">Voice Check looks at patterns in speech sounds. It is a research screening tool, not a medical test. It can miss things and it can flag things that have everyday causes, such as a cold, tiredness or a noisy room. Only a doctor can tell what is going on.</T>
            </SoftNote>

            <TextLink
              label="Learn more at the ALS Association" align="flex-start" v="body"
              accessibilityHint="Opens als.org in your browser"
              onPress={() => WebBrowser.openBrowserAsync(ALS_ASSOCIATION_URL)}
            />
          </View>
        </Reveal>
      </ScrollView>

      <View style={{ borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.bg, paddingTop: R.bottomBar.paddingTop, paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: R.paddingH, gap: R.bottomBar.gap }}>
        <T style={{ fontSize: R.bottomBar.disclaimerFontSize, textAlign: 'center', fontFamily: 'AtkinsonHyperlegible_700Bold' }}>This is a screening, not a diagnosis.</T>
        <Button label={preparing ? 'Preparing…' : 'Save a summary for my doctor'} onPress={save} disabled={preparing} />
      </View>
    </View>
  );
}
