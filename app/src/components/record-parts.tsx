import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useDerivedValue, useFrameCallback, useReducedMotion, useSharedValue, withDelay, withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { BAR_SHAPE, T } from '@/components/ui';
import { useAppTheme } from '@/lib/theme-context';
import { size, spacing } from '@/theme';

const HALF = Math.ceil(size.waveform.bars / 2); // bars 0..HALF-1 from the centre outwards
const PUSH_MS = 55; // how often a new loudness sample enters at the centre

/** One bar. `idx` is its distance from the centre bar; it shows the loudness from idx samples ago. */
function LiveBar({ history, idx }: { history: SharedValue<number[]>; idx: number }) {
  const { palette } = useAppTheme();
  const w = size.waveform;
  const smoothed = useDerivedValue(() => withTiming(history.value[idx] ?? 0, { duration: 110, easing: Easing.out(Easing.quad) }));
  const taper = 1 - (0.45 * idx) / (HALF - 1); // outer bars a little shorter
  const a = useAnimatedStyle(() => ({ height: w.minBarHeight + w.maxExtra * taper * smoothed.value }));
  return <Animated.View style={[{ width: w.barWidth, borderRadius: w.barWidth / 2, backgroundColor: palette.primary }, a]} />;
}

/**
 * A travelling wave: the current voice level (0..1) enters at the centre bar and each new
 * sample pushes older ones outwards, so bars move one after another. Reduce Motion: fixed bars.
 */
export function LiveWaveform({ level }: { level: SharedValue<number> }) {
  const reduce = useReducedMotion();
  const { palette } = useAppTheme();
  const w = size.waveform;
  const history = useSharedValue<number[]>(Array.from({ length: HALF }, () => 0));
  const lastPush = useSharedValue(0);
  useFrameCallback((info) => {
    'worklet';
    if (reduce) return;
    if (info.timestamp - lastPush.value < PUSH_MS) return;
    lastPush.value = info.timestamp;
    history.value = [level.value, ...history.value.slice(0, HALF - 1)];
  });
  return (
    <View
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ height: w.stageHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
    >
      {BAR_SHAPE.map((s, i) =>
        reduce ? (
          <View key={i} style={{ width: w.barWidth, height: w.minBarHeight + 50 * s, borderRadius: w.barWidth / 2, backgroundColor: palette.primary }} />
        ) : (
          <LiveBar key={i} history={history} idx={Math.abs(i - (HALF - 1))} />
        ),
      )}
    </View>
  );
}

export function setLevel(level: SharedValue<number>, to: number) {
  const rising = to > level.value;
  level.value = withTiming(to, { duration: rising ? 80 : 220, easing: Easing.out(Easing.quad) });
}

function Tick({ i, progress, ring }: { i: number; progress: SharedValue<number>; ring: boolean }) {
  const { palette } = useAppTheme();
  const t = size.tick;
  const R = size.countdownRing / 2;
  const a = useAnimatedStyle(() => ({
    backgroundColor: ring && progress.value > (i + 0.5) / t.count ? palette.track : palette.primary,
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute', left: R - t.width / 2, top: R - t.height / 2, width: t.width, height: t.height, borderRadius: t.radius,
          transform: [{ rotate: `${(i * 360) / t.count}deg` }, { translateY: -(R - t.height / 2) }],
        },
        a,
      ]}
    />
  );
}

/** 60 ticks turn from primary to track clockwise from the top as progress goes 0..1. Reduce Motion: ring stays full. */
export function CountdownRing({ progress, children }: { progress: SharedValue<number>; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <View style={{ width: size.countdownRing, height: size.countdownRing, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: size.tick.count }, (_, i) => <Tick key={i} i={i} progress={progress} ring={!reduce} />)}
      {children}
    </View>
  );
}

/** A row of small bars for the coach card. */
function MiniBar({ h, color, delay, grow }: { h: number; color: string; delay: number; grow: boolean }) {
  const p = useSharedValue(grow ? 0 : 1);
  useEffect(() => {
    if (grow) p.value = withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [grow, delay, p]);
  const a = useAnimatedStyle(() => ({ height: Math.max(4, h * p.value) }));
  const c = size.coachBars;
  return <Animated.View style={[{ width: c.barWidth, borderRadius: c.barWidth / 2, backgroundColor: color }, a]} />;
}

export function MiniWaveRow({
  heights, colors, dotted = 0,
}: { heights: number[]; colors?: string[]; dotted?: number }) {
  const { palette } = useAppTheme();
  const reduce = useReducedMotion();
  const c = size.coachBars;
  return (
    <View
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ height: c.rowHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
    >
      {heights.map((h, i) =>
        i >= heights.length - dotted ? (
          <View key={i} style={{ width: c.barWidth, height: c.barWidth, borderRadius: c.barWidth / 2, backgroundColor: palette.track }} />
        ) : (
          <MiniBar key={i} h={h} color={colors?.[i] ?? palette.primary} delay={i * 12} grow={!reduce} />
        ),
      )}
    </View>
  );
}

export function CoachCard({
  yourLabel, yourHeights, yourColors, dotted, lookLabel = 'What we are looking for',
}: { yourLabel: string; yourHeights: number[]; yourColors?: string[]; dotted?: number; lookLabel?: string }) {
  const { palette } = useAppTheme();
  const reference = BAR_SHAPE.concat(BAR_SHAPE).slice(0, size.coachBars.bars).map((s) => 14 + 44 * s);
  return (
    <View style={{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: size.border, borderRadius: 24, padding: spacing.xl, gap: spacing.m }}>
      <T v="caption" color="textSecondary" style={{ fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{yourLabel}</T>
      <MiniWaveRow heights={yourHeights} colors={yourColors} dotted={dotted} />
      <T v="caption" color="textSecondary" style={{ fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{lookLabel}</T>
      <MiniWaveRow heights={reference} />
    </View>
  );
}
