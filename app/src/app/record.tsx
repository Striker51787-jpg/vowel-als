import {
  getRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder,
} from 'expo-audio';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import Animated, {
  Easing, FadeIn, useReducedMotion, useSharedValue, withTiming,
} from 'react-native-reanimated';

import { MicDisc } from '@/components/mic';
import { CoachCard, CountdownRing, LiveWaveform, setLevel } from '@/components/record-parts';
import { Button, NavLabel, PressableScale, ProgressSegments, Screen, T, TextLink } from '@/components/ui';
import { checkQuality, scoreClips, type ScoreResult } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  analyse, judge, levelFromDb, RECORDING_OPTIONS, type CoachKind, type Sample, type TakeStats,
} from '@/lib/recording';
import { session } from '@/lib/session';
import { saveResult } from '@/lib/store';
import { instructionBody, TASKS, type TaskKey } from '@/lib/tasks';
import { useAppTheme } from '@/lib/theme-context';
import { recording, size, spacing } from '@/theme';

type Phase =
  | 'instruction' | 'countdown' | 'recording' | 'settling' | 'checking' | 'coach' | 'accepted'
  | 'analyzing' | 'done' | 'error';

type Coach = {
  kind: CoachKind; headline: string; body: string; yourLabel: string; heights: number[]; colors?: string[]; dotted?: number;
  lookLabel?: string; shortTry: number;
};

const COACH_TEXT: Record<CoachKind, { headline: string; body: string; label: string }> = {
  quiet: { headline: 'That one was a little quiet.', body: 'Hold the phone about 20 cm (8 in) from your mouth and speak at a normal volume.', label: 'Your recording' },
  loud: { headline: 'That one was a little loud.', body: 'Move the phone a little farther away.', label: 'Your recording (flat tops are too loud)' },
  noisy: { headline: 'We heard some background noise.', body: 'Try a quieter room.', label: 'Your recording (grey is background noise)' },
  short: { headline: 'That was a short one.', body: 'Try holding it a bit longer, or tap “Use this recording” to continue.', label: 'Your recording' },
  server: { headline: 'Let’s try that once more.', body: 'Try again in a quiet spot, holding the phone about 20 cm (8 in) from your mouth.', label: 'Your recording' },
};

export default function Record() {
  useKeepAwake();
  const router = useRouter();
  const { user } = useAuth();
  const { palette } = useAppTheme();
  const reduce = useReducedMotion();
  const recorder = useAudioRecorder(RECORDING_OPTIONS);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('instruction');
  const [count, setCount] = useState<string>('3');
  const [elapsed, setElapsed] = useState(0);
  const [cue, setCue] = useState('');
  const [voiceWord, setVoiceWord] = useState('good');
  const [coach, setCoach] = useState<Coach | null>(null);
  const [errorText, setErrorText] = useState('');

  const level = useSharedValue(0);
  const ring = useSharedValue(0);
  const task = TASKS[idx];

  const clips = useRef<Partial<Record<TaskKey, { uri: string; seconds: number }>>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const take = useRef({
    goAt: 0, samples: [] as Sample[], speechStarted: false, lastVoiceT: 0, stopping: false, lowSince: 0, floorDb: -60,
  });
  const shortTries = useRef<Record<string, number>>({});
  const scored = useRef<ScoreResult | null>(null);
  const lastWordAt = useRef(0);
  const alive = useRef(true);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(() => alive.current && fn(), ms));
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (poll.current) clearInterval(poll.current);
    poll.current = null;
  };

  useEffect(() => {
    alive.current = true;
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => {});
    return () => {
      alive.current = false;
      clearTimers();
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      try { if (recorder.getStatus().isRecording) void recorder.stop(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const discard = (uri?: string | null) => {
    if (!uri) return;
    try { new File(uri).delete(); } catch {}
  };

  const exit = () => {
    Alert.alert('Stop this check?', 'Your progress on this check will be lost. Nothing is saved.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Stop the check', style: 'destructive',
        onPress: () => {
          clearTimers();
          Object.values(clips.current).forEach((c) => discard(c?.uri));
          router.replace('/home');
        },
      },
    ]);
  };

  /* ---------- recording ---------- */

  const finishTake = useCallback(async () => {
    const t = take.current;
    if (t.stopping) return;
    t.stopping = true;
    if (poll.current) clearInterval(poll.current);
    poll.current = null;
    setPhase('settling');
    setLevel(level, 0);
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
    } catch {}
    const stats = analyse(t.samples);
    const seconds = stats.speechSeconds;
    await new Promise((r) => setTimeout(r, 600));
    if (!alive.current) return;
    if (!uri) {
      setErrorText('We could not save that recording. Please try again.');
      setPhase('error');
      return;
    }
    setPhase('checking');
    const local = judge(stats);
    let kind: CoachKind | null = local;
    let reason: string | null = null;
    try {
      const q = await checkQuality(task.key, uri, stats.totalSeconds);
      if (!q.ok) reason = q.reason;
      if (!q.ok && !kind) kind = 'server';
    } catch {
      // The server being unreachable never blocks a recording; scoring will report it if it persists.
    }
    if (!alive.current) return;
    if (!kind) {
      accept(uri, seconds);
      return;
    }
    const tries = (shortTries.current[task.key] ?? 0) + (kind === 'short' ? 1 : 0);
    shortTries.current[task.key] = tries;
    setCoach(buildCoach(kind, stats, reason, tries, uri, seconds));
    setPhase('coach');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  const buildCoach = (kind: CoachKind, s: TakeStats, reason: string | null, tries: number, uri: string, seconds: number): Coach => {
    const txt = COACH_TEXT[kind];
    const row = (v: number) => 6 + v * 50;
    let heights = s.bins.map(row);
    let colors: string[] | undefined;
    let dotted: number | undefined;
    if (kind === 'quiet') heights = s.bins.map((v) => 5 + v * 8);
    if (kind === 'loud') heights = s.bins.map((v) => (v > 0.7 ? 52 : row(v)));
    if (kind === 'noisy') colors = s.noiseBins.map((n) => (n ? palette.noise : palette.primary));
    let lookLabel: string | undefined;
    if (kind === 'short') {
      const filled = Math.max(2, Math.min(size.coachBars.bars - 4, Math.round((Math.max(seconds, 0.4) / recording.vowelAimSeconds) * size.coachBars.bars)));
      heights = Array.from({ length: size.coachBars.bars }, (_, i) => row(s.bins[Math.floor((i / filled) * s.bins.length)] ?? 0.4));
      dotted = size.coachBars.bars - filled;
      lookLabel = 'What we are looking for: 5 seconds or more';
    }
    pending.current = { uri, seconds };
    return {
      kind,
      headline: kind === 'short' && tries >= recording.shortTryLimitBeforeOfferingUse ? 'That was a short one again.' : txt.headline,
      body: kind === 'short' && tries >= recording.shortTryLimitBeforeOfferingUse
        ? 'That is okay. You can use this recording and continue, or try once more.'
        : reason ?? txt.body,
      yourLabel: txt.label, heights, colors, dotted, lookLabel, shortTry: tries,
    };
  };
  const pending = useRef<{ uri: string; seconds: number } | null>(null);

  const startPolling = () => {
    const t = take.current;
    poll.current = setInterval(() => {
      let db = -160;
      try { db = recorder.getStatus().metering ?? -160; } catch {}
      const now = (Date.now() - t.goAt) / 1000;
      t.samples.push({ t: now, db });
      if (now < 0) return;
      // Noise floor from the 0.5 s of pre-roll before "Go".
      const pre = t.samples.filter((s) => s.t < 0 && s.db > -159);
      if (pre.length) t.floorDb = Math.max(-70, pre.reduce((a, s) => a + s.db, 0) / pre.length);
      const metered = db > -159 || t.samples.some((s) => s.db > -159);
      const lv = metered ? levelFromDb(db) : 0.3;
      setLevel(level, lv);
      const voiced = db > t.floorDb + recording.speechAboveNoiseDb;
      if (voiced) { t.speechStarted = true; t.lastVoiceT = now; t.lowSince = 0; }
      else if (db < t.floorDb + recording.silenceAboveNoiseDb && !t.lowSince) t.lowSince = now;
      if (!reduce) setElapsed(now); else if (Math.floor(now) !== Math.floor(elapsedRef.current)) setElapsed(now);
      elapsedRef.current = now;
      // Cues and reduce-motion level word update at most once a second.
      if (now - lastWordAt.current >= 1) {
        lastWordAt.current = now;
        setVoiceWord(lv < 0.25 ? 'low' : lv > 0.92 ? 'high' : 'good');
        setCue(cueFor(task.kind, now, t.lowSince > 0 && now - t.lowSince >= 1));
      }
      if (metered) {
        if (t.speechStarted && now - t.lastVoiceT >= recording.autoStopSilenceSeconds) void finishTake();
        else if (!t.speechStarted && now >= recording.noSpeechGiveUpSeconds) void finishTake();
      }
      if (now >= recording.hardCapSeconds) void finishTake();
    }, 50);
  };
  const elapsedRef = useRef(0);

  const cueFor = (kind: 'vowel' | 'syllable', now: number, quiet: boolean) => {
    if (quiet) return 'Keep going. A little louder if you can.';
    if (kind === 'syllable') return 'Fast and even. Keep going.';
    return now >= recording.vowelAimSeconds ? 'Good. Stop whenever you are ready.' : 'Steady and easy. Keep going.';
  };

  const beginCountdown = async () => {
    const perm = await getRecordingPermissionsAsync();
    if (!perm.granted) {
      router.push('/microphone');
      return;
    }
    clearTimers();
    take.current = { goAt: 0, samples: [], speechStarted: false, lastVoiceT: 0, stopping: false, lowSince: 0, floorDb: -60 };
    elapsedRef.current = 0;
    lastWordAt.current = 0;
    setElapsed(0);
    setCue(cueFor(task.kind, 0, false));
    setVoiceWord('good');
    setCount('3');
    setPhase('countdown');
    ring.value = 0;
    try {
      await recorder.prepareToRecordAsync();
    } catch {
      setErrorText('We could not open the microphone. Please try again.');
      setPhase('error');
      return;
    }
    if (!alive.current) return;
    if (!reduce) ring.value = withTiming(1, { duration: recording.countdownSeconds * 1000, easing: Easing.linear });
    later(() => setCount('2'), 1000);
    later(() => setCount('1'), 2000);
    // Mic opens 0.5 s before "Go": the server uses that first stretch as the room-noise sample.
    later(() => {
      take.current.goAt = Date.now() + recording.micOpensBeforeGoSeconds * 1000;
      try { recorder.record(); } catch {}
      startPolling();
    }, (recording.countdownSeconds - recording.micOpensBeforeGoSeconds) * 1000);
    later(() => {
      setCount('Go');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, recording.countdownSeconds * 1000);
    later(() => setPhase('recording'), recording.countdownSeconds * 1000 + 700);
  };

  const cancelCountdown = async () => {
    clearTimers();
    try { if (recorder.getStatus().isRecording) await recorder.stop(); } catch {}
    discard(recorder.uri);
    setPhase('instruction');
  };

  /* ---------- accept / next ---------- */

  const accept = (uri: string, seconds: number) => {
    clips.current[task.key] = { uri, seconds };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setPhase('accepted');
    later(() => {
      if (idx < TASKS.length - 1) {
        setIdx(idx + 1);
        setCoach(null);
        setPhase('instruction');
      } else {
        void analyze();
      }
    }, reduce ? 450 : 700);
  };

  const recordAgain = () => {
    discard(pending.current?.uri);
    pending.current = null;
    setCoach(null);
    void beginCountdown();
  };

  /* ---------- analyse and save ---------- */

  const analyze = async () => {
    setPhase('analyzing');
    try {
      if (!scored.current) {
        const list = TASKS.map((t) => ({ task: t.key, uri: clips.current[t.key]!.uri }));
        scored.current = await scoreClips(list);
      }
      const r = scored.current;
      const saved = await saveResult(user!.uid, {
        band: r.band, modelScore: r.model_score, metrics: r.metrics, qualityWarnings: r.quality_warnings,
        modelVersion: r.model_version, preScreen: session.preScreen,
      });
      Object.values(clips.current).forEach((c) => discard(c?.uri));
      clips.current = {};
      scored.current = null;
      session.preScreen = undefined;
      (resultId as { current: string }).current = saved.id;
      if (alive.current) setPhase('done');
    } catch (e) {
      if (!alive.current) return;
      setErrorText(
        scored.current
          ? 'We could not save your result. Check your connection and try again.'
          : 'We could not reach the scoring service. Check your connection and try again.',
      );
      setPhase('error');
    }
  };
  const resultId = useRef('');

  /* ---------- render ---------- */

  const fade = reduce ? FadeIn.duration(150) : FadeIn.duration(250);
  const headerRight = `Task ${idx + 1} of ${TASKS.length}`;

  const Header = (
    <View style={{ gap: spacing.m }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <NavLabel label="Exit" onPress={exit} />
        <T v="headerLabel" accessibilityRole="header">{headerRight}</T>
      </View>
      <ProgressSegments current={phase === 'accepted' ? idx + 1 : idx} />
    </View>
  );

  if (phase === 'analyzing' || phase === 'done') {
    const done = phase === 'done';
    return (
      <Screen
        footer={done ? <Button label="See my result" onPress={() => router.replace(`/result/${resultId.current}?reveal=1`)} /> : null}
      >
        <View style={{ gap: spacing.xl }}>
          <ProgressSegments current={TASKS.length} allDone />
        </View>
        <Animated.View key={phase} entering={fade} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl }}>
          {done ? (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 44, height: 24, borderLeftWidth: 6, borderBottomWidth: 6, borderColor: palette.onPrimary, transform: [{ rotate: '-45deg' }], marginTop: -8 }} />
            </View>
          ) : (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><MicDisc breathe period={2400} glyph="bars" /></View>
          )}
          <T v="title" style={{ textAlign: 'center' }} accessibilityRole="header">{done ? 'All eight tasks are done.' : 'Looking at your voice.'}</T>
          <T v="bodyLarge" color="textSecondary" style={{ textAlign: 'center' }}>
            {done ? 'Thank you for taking your time. Your result is ready.' : 'This takes a few seconds. You do not need to do anything.'}
          </T>
          {done ? <T color="textSecondary" style={{ textAlign: 'center' }}>A screening only. It is not a diagnosis.</T> : null}
        </Animated.View>
      </Screen>
    );
  }

  if (phase === 'error') {
    return (
      <Screen
        footer={
          <>
            <Button
              label="Try again"
              onPress={() => {
                if (Object.keys(clips.current).length === TASKS.length) void analyze();
                else { setPhase('instruction'); }
              }}
            />
            <TextLink label="Exit" onPress={exit} />
          </>
        }
      >
        {Header}
        <Animated.View entering={fade} style={{ gap: spacing.m, paddingTop: spacing.xl }}>
          <T v="title" accessibilityRole="header">That did not work.</T>
          <T v="bodyLarge" color="textSecondary">{errorText}</T>
        </Animated.View>
      </Screen>
    );
  }

  if (phase === 'coach' && coach) {
    const second = coach.kind === 'short' && coach.shortTry >= recording.shortTryLimitBeforeOfferingUse;
    const use = () => accept(pending.current!.uri, pending.current!.seconds);
    return (
      <Screen
        footer={
          coach.kind === 'short' ? (
            <>
              <Button label="Use this recording" onPress={use} />
              {second ? <TextLink label="Try once more" onPress={recordAgain} /> : <Button label="Try again" variant="outline" onPress={recordAgain} />}
            </>
          ) : (
            <>
              <Button label="Record again" onPress={recordAgain} />
              <TextLink label="Use this recording anyway" onPress={use} />
            </>
          )
        }
      >
        {Header}
        <Animated.View entering={fade} style={{ gap: spacing.l, paddingTop: spacing.xl }}>
          <T v="button" color="textSecondary">{second ? 'Second try' : 'A quick check'}</T>
          <T v="title" accessibilityRole="header">{coach.headline}</T>
          <T v="bodyLarge" color="textSecondary">{coach.body}</T>
          <CoachCard yourLabel={coach.yourLabel} yourHeights={coach.heights} yourColors={coach.colors} dotted={coach.dotted} lookLabel={coach.lookLabel} />
        </Animated.View>
      </Screen>
    );
  }

  if (phase === 'countdown') {
    return (
      <Screen footer={<TextLink label="Not yet" onPress={cancelCountdown} />}>
        {Header}
        <Animated.View entering={fade} style={{ flex: 1, alignItems: 'center', gap: spacing.xl, paddingTop: spacing.l }}>
          <T v="button" color="textSecondary">Get ready</T>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <CountdownRing progress={ring}>
              <Animated.View key={count} entering={reduce ? undefined : FadeIn.duration(250)} accessible accessibilityLabel={count} accessibilityLiveRegion="polite">
                <T v="countdownNumber">{count}</T>
              </Animated.View>
            </CountdownRing>
          </View>
          <T v="button" style={{ fontSize: 26, lineHeight: 32 }}>Take a breath in.</T>
          <T v="body" color="textSecondary" style={{ textAlign: 'center', paddingHorizontal: spacing.xl }}>
            We listen to the room for a moment first, so we can hear you clearly.
          </T>
        </Animated.View>
      </Screen>
    );
  }

  if (phase === 'recording' || phase === 'settling' || phase === 'checking' || phase === 'accepted') {
    const active = phase === 'recording';
    const shown = reduce ? Math.floor(elapsed) : elapsed.toFixed(1);
    return (
      <Screen
        footer={
          <>
            <T color="textSecondary" style={{ textAlign: 'center' }}>Stop whenever you need to. We also stop on our own after a short pause.</T>
            <Button
              label="Stop" variant="outline" disabled={!active} onPress={() => void finishTake()}
              icon={<View style={{ width: 22, height: 22, borderRadius: 5, backgroundColor: palette.primaryText }} />}
            />
          </>
        }
      >
        {Header}
        <Animated.View entering={fade} style={{ flex: 1, gap: spacing.m, paddingTop: spacing.l }}>
          <T v="button" color="textSecondary">{phase === 'checking' ? 'Checking' : phase === 'accepted' ? 'Got it' : 'Listening'}</T>
          <T v="soundWord" style={{ color: palette.primaryText }}>{task.word}</T>
          <View style={{ flex: 1, justifyContent: 'center' }}><LiveWaveform level={level} /></View>
          <View style={{ alignItems: 'center', gap: spacing.l, minHeight: 150 }} accessible accessibilityLabel={`${shown} seconds. ${cue}`}>
            <T v="timer">{`${shown} s`}</T>
            {reduce ? <T color="textSecondary">{`Voice level: ${voiceWord}`}</T> : null}
            {/* The fade-in sits on the outer view and the static opacity on the inner one, so they don't conflict. */}
            <Animated.View key={cue} entering={reduce ? undefined : FadeIn.duration(400)}>
              <View style={{ backgroundColor: palette.soft, borderRadius: 9999, paddingVertical: spacing.l, paddingHorizontal: spacing.xl, opacity: active ? 1 : 0 }}>
                <T v="button" color="textSecondary" style={{ textAlign: 'center', fontSize: 21 }}>{cue}</T>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </Screen>
    );
  }

  // instruction
  return (
    <Screen scroll>
      {Header}
      <Animated.View entering={fade} style={{ gap: spacing.l, paddingTop: spacing.xl }}>
        <T v="button" color="textSecondary">{task.kicker}</T>
        <T v="soundWord" style={{ color: palette.primaryText }} accessibilityRole="header">{task.word}</T>
        <T v="bodyLarge">{instructionBody(task)}</T>
        <T v="body" color="textSecondary">There is no set time. We stop listening after a short pause.</T>
        <View style={{ alignItems: 'center', gap: spacing.l, paddingTop: spacing.l }}>
          <PressableScale
            onPress={beginCountdown} accessibilityRole="button" accessibilityLabel="Tap to start"
            accessibilityHint="Starts a three second countdown, then records this task"
          >
            <MicDisc breathe />
          </PressableScale>
          <T v="button" color="text" style={{ marginTop: -spacing.s }}>Tap to start</T>
        </View>
      </Animated.View>
    </Screen>
  );
}
