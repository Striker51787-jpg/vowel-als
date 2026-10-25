import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/lib/theme-context';
import { auth } from '@/theme';

/** Microphone disc with a soft halo. `breathe`: loop 4000 ms (instruction) or 2400 ms (looking), reduced: static 0.7. */
export function MicDisc({
  breathe = false, period = 4000, glyph = 'mic',
}: { breathe?: boolean; period?: number; glyph?: 'mic' | 'bars' }) {
  const { palette } = useAppTheme();
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (breathe && !reduce) {
      p.value = withRepeat(withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }), -1, true);
    } else {
      p.value = 0.5;
    }
  }, [breathe, reduce, period, p]);
  const halo = useAnimatedStyle(() => ({
    opacity: reduce || !breathe ? 0.7 : 0.45 + 0.4 * p.value,
    transform: reduce || !breathe ? [] : [{ scale: 1 + 0.06 * p.value }],
  }));
  const m = auth.micIllustration;
  return (
    <View style={{ width: m.halo, height: m.halo, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: m.halo, height: m.halo, borderRadius: m.halo / 2, backgroundColor: palette.ring }, halo]} />
      <View style={{ position: 'absolute', width: m.inner + 24, height: m.inner + 24, borderRadius: (m.inner + 24) / 2, backgroundColor: palette.soft }} />
      <View style={{ width: m.inner, height: m.inner, borderRadius: m.inner / 2, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' }}>
        {glyph === 'mic' ? (
          <View style={{ width: m.pill.width, height: m.pill.height, borderRadius: m.pill.radius, backgroundColor: palette.onPrimary }} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {[24, 46, 30, 52, 24].map((h, i) => (
              <View key={i} style={{ width: 7, height: h, borderRadius: 4, backgroundColor: palette.onPrimary }} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
