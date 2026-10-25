import { useEffect, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation, Easing, interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/lib/theme-context';
import { auth as authTokens, radius, size, spacing, step5, type as typeScale } from '@/theme';
import type { Band } from '@/lib/api';

type Variant = keyof typeof typeScale;

export function T({
  v = 'body', color = 'text', style, children, ...rest
}: {
  v?: Variant; color?: 'text' | 'textSecondary' | 'primaryText' | 'onPrimary';
  style?: StyleProp<TextStyle>; children: ReactNode;
} & React.ComponentProps<typeof Text>) {
  const { palette } = useAppTheme();
  return (
    <Text {...rest} style={[typeScale[v] as TextStyle, { color: palette[color] }, style]}>
      {children}
    </Text>
  );
}

/** Fade-and-rise on first render. Reduce Motion: opacity only, 150 ms. */
export function Enter({ children, style, dx = 0 }: { children: ReactNode; style?: StyleProp<ViewStyle>; dx?: number }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, reduce ? { duration: 150, easing: Easing.linear } : { duration: 300, easing: Easing.out(Easing.cubic) });
  }, [p, reduce]);
  const a = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: reduce ? [] : [{ translateY: (1 - p.value) * 8 }, { translateX: (1 - p.value) * dx }],
  }));
  return <Animated.View style={[{ flex: 1 }, style, a]}>{children}</Animated.View>;
}

export function Screen({
  children, scroll = false, footer, pad = true, style,
}: {
  children: ReactNode; scroll?: boolean; footer?: ReactNode; pad?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const padH = pad ? size.screenPaddingH : 0;
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingHorizontal: padH, paddingTop: insets.top + spacing.m, paddingBottom: spacing.xl, flexGrow: 1 }}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingHorizontal: padH, paddingTop: insets.top + spacing.m }, style]}>{children}</View>
  );
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: palette.bg }}>
      <Enter>{body}</Enter>
      {footer ? (
        <View style={{ paddingHorizontal: size.screenPaddingH, paddingBottom: Math.max(insets.bottom, spacing.l), paddingTop: spacing.s, gap: spacing.s }}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

/** Press feedback: scale 0.96 (100 in / 160 out). Reduce Motion: opacity dips to 0.8 instead. */
export function PressableScale({
  onPress, disabled, style, children, dim = false, ...rest
}: {
  onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; children: ReactNode; dim?: boolean;
} & Omit<React.ComponentProps<typeof Pressable>, 'style' | 'onPress' | 'children'>) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  const a = useAnimatedStyle(() => ({
    transform: reduce || dim ? [] : [{ scale: 1 - 0.04 * p.value }],
    opacity: reduce ? 1 - 0.2 * p.value : dim ? 1 - 0.15 * p.value : 1,
  }));
  return (
    <Pressable
      {...rest} disabled={disabled} onPress={onPress}
      onPressIn={() => { p.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) }); }}
      onPressOut={() => { p.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) }); }}
    >
      <Animated.View style={[style, a]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Button({
  label, onPress, variant = 'primary', disabled, icon, accessibilityHint,
}: {
  label: string; onPress: () => void; variant?: 'primary' | 'outline'; disabled?: boolean;
  icon?: ReactNode; accessibilityHint?: string;
}) {
  const { palette } = useAppTheme();
  const reduce = useReducedMotion();
  const on = useSharedValue(disabled ? 0 : 1);
  useEffect(() => {
    on.value = withTiming(disabled ? 0 : 1, { duration: reduce ? 0 : 200, easing: Easing.linear });
  }, [disabled, on, reduce]);
  const bg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [palette.track, palette.primary]),
  }));
  const common: ViewStyle = {
    height: size.buttonHeight, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: spacing.m, paddingHorizontal: spacing.l,
  };
  const content = (c: 'onPrimary' | 'primaryText' | 'textSecondary') => (
    <>
      {icon}
      <T v="button" color={c} numberOfLines={1} adjustsFontSizeToFit>{label}</T>
    </>
  );
  return (
    <PressableScale
      onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
      accessibilityHint={accessibilityHint} accessibilityState={{ disabled: !!disabled }}
    >
      {variant === 'primary' ? (
        <Animated.View style={[common, bg]}>{content(disabled ? 'textSecondary' : 'onPrimary')}</Animated.View>
      ) : (
        <View style={[common, { backgroundColor: palette.surface, borderWidth: 2, borderColor: palette.primary }]}>
          {content('primaryText')}
        </View>
      )}
    </PressableScale>
  );
}

export function TextLink({
  label, onPress, align = 'center', v = 'button', accessibilityHint,
}: { label: string; onPress: () => void; align?: 'center' | 'flex-start'; v?: Variant; accessibilityHint?: string }) {
  return (
    <Pressable
      onPress={onPress} accessibilityRole="link" accessibilityLabel={label} accessibilityHint={accessibilityHint}
      style={{ minHeight: size.minTouch, justifyContent: 'center', alignSelf: align === 'center' ? 'center' : 'flex-start' }}
      hitSlop={8}
    >
      <T v={v} color="primaryText" style={{ textDecorationLine: 'underline', fontSize: v === 'button' ? 20 : undefined }}>{label}</T>
    </Pressable>
  );
}

export function NavLabel({ label, onPress, side = 'left' }: { label: string; onPress: () => void; side?: 'left' | 'right' }) {
  return (
    <Pressable
      onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}
      style={{ minHeight: size.minTouch, minWidth: size.minTouch, justifyContent: 'center', alignItems: side === 'left' ? 'flex-start' : 'flex-end' }}
    >
      <T v="headerLabel" color="primaryText">{label}</T>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { palette } = useAppTheme();
  return (
    <View style={[{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: size.border, borderRadius: radius.card, padding: spacing.xl }, style]}>
      {children}
    </View>
  );
}

export function SoftNote({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { palette } = useAppTheme();
  return (
    <View style={[{ backgroundColor: palette.soft, borderRadius: authTokens.softNote.radius, paddingVertical: authTokens.softNote.paddingV, paddingHorizontal: authTokens.softNote.paddingH }, style]}>
      {children}
    </View>
  );
}

export function BandChip({ band, big = false }: { band: Band; big?: boolean }) {
  const { palette } = useAppTheme();
  const c = palette.band[band];
  const label = band[0].toUpperCase() + band.slice(1);
  return (
    <View
      style={{
        backgroundColor: c.bg, alignSelf: 'flex-start',
        borderRadius: big ? 16 : step5.bandChip.radius,
        paddingVertical: big ? 10 : step5.bandChip.paddingV, paddingHorizontal: big ? 20 : step5.bandChip.paddingH,
      }}
    >
      <Text
        style={{
          color: c.ink, fontFamily: big ? 'Fraunces_600SemiBold' : 'AtkinsonHyperlegible_700Bold',
          fontSize: big ? 38 : step5.bandChip.fontSize, lineHeight: big ? 44 : 24,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function LogoMark({ withName = true }: { withName?: boolean }) {
  const { palette } = useAppTheme();
  const l = authTokens.logoMark;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }} accessible accessibilityRole="header" accessibilityLabel="Voice Check">
      <View style={{ width: l.diameter, height: l.diameter, borderRadius: l.diameter / 2, backgroundColor: palette.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: l.gap }}>
        {l.barHeights.map((h, i) => (
          <View key={i} style={{ width: l.barWidth, height: h, borderRadius: l.barWidth / 2, backgroundColor: palette.onPrimary }} />
        ))}
      </View>
      {withName ? <T v="button">Voice Check</T> : null}
    </View>
  );
}

const SHAPE = [0.3, 0.55, 0.35, 0.2, 0.5, 0.75, 0.75, 0.4, 0.3, 0.7, 0.9, 0.85, 0.45, 0.3, 0.75, 1, 0.9, 0.45, 0.35, 0.6, 0.7, 0.5, 0.3, 0.25, 0.45, 0.4, 0.3];
export const BAR_SHAPE = SHAPE;

/** Slow looping phase (0..2π) that drives the gentle ambient wave. Reduce Motion: stays at 0. */
export function useWaveClock(): SharedValue<number> {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    t.value = withRepeat(withTiming(Math.PI * 2, { duration: 3200, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [reduce, t]);
  return t;
}

/** Vertical scale (0.7..1) of bar `i` at clock phase `t`; neighbouring bars lag each other, so a wave travels along. */
export function waveScale(t: number, i: number): number {
  'worklet';
  return 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t - i * 0.45));
}

function AmbientBar({ i, h, clock }: { i: number; h: number; clock: SharedValue<number> }) {
  const { palette } = useAppTheme();
  const a = useAnimatedStyle(() => ({ transform: [{ scaleY: waveScale(clock.value, i) }] }));
  return <Animated.View style={[{ width: 7, height: h, borderRadius: 4, backgroundColor: palette.primary }, a]} />;
}

/** Decorative waveform (home first time). A gentle wave travels along it; with Reduce Motion it is still. */
export function StaticWaveform({ stage, minBar, maxExtra, bars = 27 }: { stage: number; minBar: number; maxExtra: number; bars?: number }) {
  const clock = useWaveClock();
  return (
    <View
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ height: stage, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
    >
      {Array.from({ length: bars }, (_, i) => (
        <AmbientBar key={i} i={i} h={minBar + maxExtra * SHAPE[i % SHAPE.length]} clock={clock} />
      ))}
    </View>
  );
}

export function ProgressSegments({ current, count = size.progress.count, allDone = false }: { current: number; count?: number; allDone?: boolean }) {
  const { palette } = useAppTheme();
  const p = size.progress;
  return (
    <View
      accessible accessibilityLabel={allDone ? 'All tasks done' : `Task ${current + 1} of ${count}`}
      style={{ flexDirection: 'row', gap: p.gap }}
    >
      {Array.from({ length: count }, (_, i) => {
        const done = allDone || i < current;
        const isCurrent = !allDone && i === current;
        return (
          <View
            key={i}
            style={{
              flex: 1, height: p.height, borderRadius: p.height / 2,
              backgroundColor: done ? palette.primary : palette.track,
              borderWidth: done || isCurrent ? p.border : 0, borderColor: isCurrent ? palette.primary : palette.track,
            }}
          />
        );
      })}
    </View>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  const { palette } = useAppTheme();
  const reduce = useReducedMotion();
  const p = useSharedValue(checked ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(checked ? 1 : 0, { duration: reduce ? 0 : 160, easing: Easing.out(Easing.quad) });
  }, [checked, p, reduce]);
  const c = authTokens.checkbox;
  const box = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], ['rgba(0,0,0,0)', palette.primary]) }));
  const tick = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ rotate: `${c.check.rotateDeg}deg` }, { scale: reduce ? 1 : 0.6 + 0.4 * p.value }] }));
  return (
    <Pressable
      onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityLabel={label}
      accessibilityState={{ checked }} style={{ flexDirection: 'row', gap: spacing.m, alignItems: 'flex-start', minHeight: size.minTouch }}
    >
      <Animated.View
        style={[{ width: c.box, height: c.box, borderRadius: c.radius, borderWidth: c.uncheckedBorder, borderColor: checked ? palette.primary : palette.textSecondary, alignItems: 'center', justifyContent: 'center', marginTop: 2 }, box]}
      >
        <Animated.View style={[{ width: c.check.width, height: c.check.height, borderLeftWidth: c.check.border, borderBottomWidth: c.check.border, borderColor: palette.onPrimary, marginTop: -3 }, tick]} />
      </Animated.View>
      <T style={{ flex: 1 }}>{label}</T>
    </Pressable>
  );
}

export function Field({
  label, secure = false, helper, errorBorder, ...rest
}: { label: string; secure?: boolean; helper?: string; errorBorder?: boolean } & TextInputProps) {
  const { palette } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const thick = focused || errorBorder;
  const color = errorBorder ? palette.primaryText : focused ? palette.focus : palette.border;
  const fieldPad = secure ? authTokens.passwordRightPadding : authTokens.inputPaddingH;
  return (
    <View style={{ gap: spacing.s }}>
      <T color="text" style={{ fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{label}</T>
      <View>
        <TextInput
          {...rest}
          accessibilityLabel={label}
          secureTextEntry={secure && !show}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          placeholderTextColor={palette.textSecondary}
          style={{
            height: size.fieldHeight, borderRadius: authTokens.inputRadius, backgroundColor: palette.surface, color: palette.text,
            fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 21,
            borderWidth: thick ? authTokens.inputBorderFocused : authTokens.inputBorder, borderColor: color,
            paddingLeft: authTokens.inputPaddingH - (thick ? 1 : 0), paddingRight: fieldPad - (thick ? 1 : 0),
          }}
        />
        {secure ? (
          <Pressable
            onPress={() => setShow((s) => !s)} accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, minWidth: authTokens.showButtonMinWidth + 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.m }}
          >
            <T v="headerLabel" color="primaryText">{show ? 'Hide' : 'Show'}</T>
          </Pressable>
        ) : null}
      </View>
      {helper ? <T v="caption" color="textSecondary">{helper}</T> : null}
    </View>
  );
}

/** Message box that grows in and fades (login errors). No red. */
export function MessageBox({ message }: { message: string | null }) {
  const { palette } = useAppTheme();
  const reduce = useReducedMotion();
  const [text, setText] = useState(message);
  const [h, setH] = useState(0);
  const p = useSharedValue(message ? 1 : 0);
  useEffect(() => {
    if (message) setText(message);
    p.value = withTiming(message ? 1 : 0, { duration: reduce ? 0 : message ? 250 : 200, easing: Easing.out(Easing.cubic) });
  }, [message, p, reduce]);
  const a = useAnimatedStyle(() => ({ height: h * p.value, opacity: p.value, overflow: 'hidden' }));
  return (
    <Animated.View style={a}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0 }} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
        <View
          accessible={!!message} accessibilityRole="alert" accessibilityLiveRegion="polite" accessibilityLabel={text ?? ''}
          style={{
            backgroundColor: palette.surface, borderWidth: authTokens.errorBox.border, borderColor: palette.primaryText,
            borderRadius: authTokens.errorBox.radius, paddingVertical: authTokens.errorBox.paddingV, paddingHorizontal: authTokens.errorBox.paddingH,
          }}
        >
          <T>{text ?? ''}</T>
        </View>
      </View>
    </Animated.View>
  );
}
