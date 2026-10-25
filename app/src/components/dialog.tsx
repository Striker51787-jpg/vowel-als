import { useEffect, type ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, T } from '@/components/ui';
import { useAppTheme } from '@/lib/theme-context';
import { spacing, step5 } from '@/theme';

/** Scrim and dialog fade together (200 ms in, 150 ms out). The safe button is the primary one; no red anywhere. */
export function ConfirmDialog({
  visible, title, body, keepLabel, confirmLabel, onKeep, onConfirm, busy, children,
}: {
  visible: boolean; title: string; body: string; keepLabel: string; confirmLabel: string;
  onKeep: () => void; onConfirm: () => void; busy?: boolean; children?: ReactNode;
}) {
  const { palette } = useAppTheme();
  const reduce = useReducedMotion();
  const insets = useSafeAreaInsets();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(visible ? 1 : 0, { duration: reduce ? 0 : visible ? 200 : 150, easing: visible ? Easing.out(Easing.quad) : Easing.linear });
  }, [visible, p, reduce]);
  const scrim = useAnimatedStyle(() => ({ opacity: p.value }));
  const card = useAnimatedStyle(() => ({ opacity: p.value }));
  const d = step5.deleteDialog;
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onKeep} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: d.scrim }, scrim]}>
          <Pressable style={{ flex: 1 }} onPress={onKeep} accessibilityLabel="Close" accessibilityRole="button" />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[{
            backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: d.radius,
            marginHorizontal: 12, marginBottom: Math.max(insets.bottom, 12), paddingTop: d.paddingTop, paddingHorizontal: d.paddingH,
            paddingBottom: d.paddingBottom, gap: spacing.l,
          }, card]}
        >
          <T v="title" accessibilityRole="header" style={{ fontSize: 30, lineHeight: 36 }}>{title}</T>
          <T color="textSecondary">{body}</T>
          {children}
          <View style={{ gap: spacing.s }}>
            <Button label={keepLabel} onPress={onKeep} />
            <Button label={busy ? 'Deleting…' : confirmLabel} variant="outline" onPress={onConfirm} disabled={busy} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
