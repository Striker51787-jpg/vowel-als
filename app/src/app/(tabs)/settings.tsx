import { useRouter } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';

import { PressableScale, Screen, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAppTheme, type Appearance } from '@/lib/theme-context';
import { spacing, step5 } from '@/theme';

function Row({ label, value, onPress, bold }: { label: string; value?: string; onPress?: () => void; bold?: boolean }) {
  const { palette } = useAppTheme();
  const inner = (
    <View style={{ minHeight: 56, paddingHorizontal: spacing.xl, paddingVertical: spacing.m, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.l, borderBottomWidth: 1, borderBottomColor: palette.border }}>
      <T color={bold ? 'primaryText' : 'text'} style={bold ? { fontFamily: 'AtkinsonHyperlegible_700Bold' } : undefined}>{label}</T>
      {value ? <T color="textSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>{value}</T> : null}
      {onPress && !bold ? <T color="textSecondary" style={{ fontSize: 26 }}>›</T> : null}
    </View>
  );
  if (!onPress) return <View accessible accessibilityLabel={`${label}: ${value ?? ''}`}>{inner}</View>;
  return <PressableScale dim onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>{inner}</PressableScale>;
}

function Group({ children }: { children: React.ReactNode }) {
  const { palette } = useAppTheme();
  return <View style={{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 24, overflow: 'hidden' }}>{children}</View>;
}

export default function Settings() {
  const router = useRouter();
  const { palette, appearance, setAppearance } = useAppTheme();
  const { user, displayName, logOut, resetPassword } = useAuth();
  const s = step5.segmented;

  const changePassword = () => {
    if (!user?.email) return;
    Alert.alert('Change your password', `We will email a link to ${user.email}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send the link', onPress: () => resetPassword(user.email!).then(() => Alert.alert('Check your email', 'A link to choose a new password is on its way.')).catch(() => Alert.alert('Something went wrong', 'Please try again.')) },
    ]);
  };

  const opts: { v: Appearance; label: string }[] = [
    { v: 'system', label: 'iPhone' }, { v: 'light', label: 'Light' }, { v: 'dark', label: 'Dark' },
  ];

  return (
    <Screen scroll>
      <View style={{ gap: spacing.l, paddingTop: spacing.l }}>
        <T v="title" accessibilityRole="header">Settings</T>

        <T v="caption" color="textSecondary" style={{ fontFamily: 'AtkinsonHyperlegible_700Bold' }}>Account</T>
        <Group>
          <Row label="Name" value={displayName} />
          <Row label="Email" value={user?.email ?? ''} />
          <Row label="Change password" onPress={changePassword} />
        </Group>

        <T v="caption" color="textSecondary" style={{ fontFamily: 'AtkinsonHyperlegible_700Bold' }}>Appearance</T>
        <View style={{ flexDirection: 'row', gap: s.gap }} accessibilityRole="radiogroup">
          {opts.map((o) => {
            const on = appearance === o.v;
            return (
              <Pressable
                key={o.v} onPress={() => setAppearance(o.v)} accessibilityRole="radio" accessibilityLabel={o.label}
                accessibilityState={{ selected: on, checked: on }}
                style={{ flex: 1, height: s.height, borderRadius: s.radius, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? palette.primary : palette.surface, borderWidth: on ? 0 : s.unselectedBorder, borderColor: palette.border }}
              >
                <T v="button" color={on ? 'onPrimary' : 'primaryText'} style={{ fontSize: 20 }}>{o.label}</T>
              </Pressable>
            );
          })}
        </View>
        <T v="caption" color="textSecondary">iPhone follows your phone's setting. Text size and Reduce Motion also follow your phone.</T>

        <Group>
          <Row label="Privacy and data" onPress={() => router.push('/privacy')} />
          <Row label="About Voice Check" onPress={() => router.push('/learn/about')} />
          <Row label="Log out" bold onPress={logOut} />
        </Group>
      </View>
    </Screen>
  );
}
