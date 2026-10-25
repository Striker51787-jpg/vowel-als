import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Share, View } from 'react-native';

import { ConfirmDialog } from '@/components/dialog';
import { Card, Field, NavLabel, PressableScale, Screen, T } from '@/components/ui';
import { authMessage, useAuth } from '@/lib/auth';
import { PRIVACY_BODY } from '@/lib/copy';
import { listResults } from '@/lib/store';
import { useAppTheme } from '@/lib/theme-context';
import { spacing } from '@/theme';

export default function Privacy() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { user, deleteMyResults, deleteMyAccount } = useAuth();
  const [dialog, setDialog] = useState<null | 'results' | 'account'>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const close = () => { setDialog(null); setPassword(''); setProblem(null); };

  const download = async () => {
    if (!user) return;
    try {
      const rows = await listResults(user.uid);
      const data = {
        email: user.email,
        results: rows.map((r) => ({
          date: r.createdAt.toISOString(), band: r.band, measurements: r.metrics, recordingNotes: r.qualityWarnings,
          answersBeforeCheck: r.preScreen ?? null,
        })),
      };
      await Share.share({ message: JSON.stringify(data, null, 2), title: 'My Voice Check data' });
    } catch {
      Alert.alert('Something went wrong', 'We could not prepare your data. Please try again.');
    }
  };

  const confirm = async () => {
    setBusy(true);
    setProblem(null);
    try {
      if (dialog === 'results') {
        await deleteMyResults();
        close();
        Alert.alert('Done', 'Your results have been deleted.');
      } else {
        await deleteMyAccount(password);
        // Auth state flips to signed out and the app returns to the welcome screen.
      }
    } catch (e) {
      setProblem(dialog === 'account' ? authMessage(e, 'login').replace('That email and password do not match.', 'That password does not match.') : 'We could not delete right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const Item = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <PressableScale dim onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={{ minHeight: 60, paddingHorizontal: spacing.xl, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: palette.border }}>
        <T>{label}</T>
      </View>
    </PressableScale>
  );

  return (
    <Screen scroll>
      <View style={{ gap: spacing.l }}>
        <NavLabel label="Back" onPress={() => router.back()} />
        <T v="title" accessibilityRole="header">Privacy and data</T>
        <Card style={{ padding: spacing.xl, borderRadius: 24, backgroundColor: palette.soft }}>
          <T>{PRIVACY_BODY}</T>
        </Card>
        <View style={{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 24, overflow: 'hidden' }}>
          <Item label="Download my data" onPress={download} />
          <Item label="Delete my results" onPress={() => setDialog('results')} />
          <Item label="Delete my account" onPress={() => setDialog('account')} />
        </View>
      </View>

      <ConfirmDialog
        visible={dialog !== null} busy={busy}
        title={dialog === 'account' ? 'Delete your account?' : 'Delete all your results?'}
        body={
          dialog === 'account'
            ? 'This removes your account and every saved result. It cannot be brought back. Your voice was never saved, so there is nothing else to delete. Enter your password to confirm.'
            : 'Your account stays, but every saved result is removed and cannot be brought back. Your voice was never saved, so there are no recordings to delete.'
        }
        keepLabel={dialog === 'account' ? 'Keep my account' : 'Keep my results'}
        confirmLabel={dialog === 'account' ? 'Delete my account' : 'Delete my results'}
        onKeep={close} onConfirm={confirm}
      >
        {dialog === 'account' ? (
          <View style={{ gap: spacing.s }}>
            <Field label="Password" secure value={password} onChangeText={setPassword} autoComplete="current-password" textContentType="password" errorBorder={!!problem} />
            {problem ? <T v="caption" color="primaryText">{problem}</T> : null}
          </View>
        ) : problem ? <T v="caption" color="primaryText">{problem}</T> : null}
      </ConfirmDialog>
    </Screen>
  );
}
