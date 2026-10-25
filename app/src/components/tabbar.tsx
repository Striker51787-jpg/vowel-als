import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '@/components/ui';
import { useAppTheme } from '@/lib/theme-context';
import { home, spacing } from '@/theme';

const LABELS: Record<string, string> = { home: 'Home', results: 'Results', learn: 'Learn', settings: 'Settings' };

/** Text-only tab bar with a 4 pt underline. The disclaimer sits above it on every tab. */
export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: palette.bg }}>
      <T style={{ fontSize: home.disclaimerFontSize, textAlign: 'center', paddingVertical: spacing.m }} color="textSecondary">
        A screening, not a diagnosis.
      </T>
      <View style={{ borderTopWidth: 1, borderTopColor: palette.border, flexDirection: 'row', paddingBottom: Math.max(insets.bottom, spacing.s), paddingTop: spacing.s }}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const label = LABELS[route.name] ?? route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: focused }}
              onPress={() => {
                const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigateToTab(route.key);
              }}
              style={{ flex: 1, minHeight: home.tabBar.minTouch, alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <T v="button" color={focused ? 'primaryText' : 'textSecondary'} style={{ fontSize: home.tabBar.fontSize }}>{label}</T>
              <View style={{ height: home.tabBar.underlineHeight, width: 28, borderRadius: 2, backgroundColor: focused ? palette.primary : 'transparent' }} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
