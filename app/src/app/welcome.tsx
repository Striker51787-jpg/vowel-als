import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming, type SharedValue,
} from 'react-native-reanimated';

import { BAR_SHAPE, Button, LogoMark, Screen, SoftNote, T, useWaveClock, waveScale } from '@/components/ui';
import { useAppTheme } from '@/lib/theme-context';
import { auth, spacing } from '@/theme';

function Bar({ i, h, clock }: { i: number; h: number; clock: SharedValue<number> }) {
  const { palette } = useAppTheme();
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  const center = 13;
  useEffect(() => {
    const delay = reduce ? 0 : Math.abs(i - center) * 10;
    p.value = withDelay(delay, withTiming(1, { duration: reduce ? 200 : 600 - Math.abs(i - center) * 10, easing: Easing.out(Easing.cubic) }));
  }, [i, p, reduce]);
  // Grows in from the centre once, then a gentle wave keeps travelling along the bars.
  const a = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: reduce ? [] : [{ scaleY: (0.4 + 0.6 * p.value) * waveScale(clock.value, i) }],
  }));
  return <Animated.View style={[{ width: 7, height: h, borderRadius: 4, backgroundColor: palette.primary }, a]} />;
}

export default function Welcome() {
  const router = useRouter();
  const w = auth.welcomeWaveform;
  const clock = useWaveClock();
  return (
    <Screen
      scroll
      footer={
        <>
          <Button label="Create account" onPress={() => router.push('/signup')} />
          <Button label="Log in" variant="outline" onPress={() => router.push('/login')} />
        </>
      }
    >
      <View style={{ gap: spacing.xl, paddingTop: spacing.l }}>
        <LogoMark />
        <View
          accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          style={{ height: w.stageHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {BAR_SHAPE.map((s, i) => <Bar key={i} i={i} h={w.minBarHeight + w.maxExtra * s} clock={clock} />)}
        </View>
        <T v="display">A short voice check, at your own pace.</T>
        <T v="bodyLarge" color="textSecondary">Eight small tasks, about 2 minutes. You will see one of three bands, never a score.</T>
        <SoftNote><T>This is a high-school research prototype. It is not a diagnosis.</T></SoftNote>
      </View>
    </Screen>
  );
}
