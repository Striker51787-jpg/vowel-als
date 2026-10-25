// Recording settings and the pure maths used to judge a take. Thresholds live in theme.recording.
import { AudioQuality, IOSOutputFormat, type RecordingOptions } from 'expo-audio';
import { Platform } from 'react-native';

import { recording } from '@/theme';

/** Highest-quality mono setting: 16-bit linear PCM .wav on iOS, AAC .m4a on Android. */
export const RECORDING_OPTIONS: RecordingOptions = {
  extension: Platform.OS === 'ios' ? '.wav' : '.m4a',
  sampleRate: recording.sampleRateHz,
  numberOfChannels: 1,
  bitRate: Platform.OS === 'ios' ? recording.sampleRateHz * 16 : 128000,
  isMeteringEnabled: true,
  android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
  ios: {
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.MAX,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
};

export type Sample = { t: number; db: number }; // t = seconds after "Go" (negative = pre-roll)

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Meter dB (about -60..0) to 0..1 for the live bars. */
export const levelFromDb = (db: number) => clamp01((db - recording.meterFloorDb) / (-4 - recording.meterFloorDb));

export type CoachKind = 'quiet' | 'loud' | 'noisy' | 'short' | 'server';

export type TakeStats = {
  floorDb: number;
  peakDb: number;
  voicedAvgDb: number;
  speechSeconds: number; // first to last voiced moment
  totalSeconds: number;
  heardSpeech: boolean;
  metered: boolean;
  bins: number[]; // 0..1, 30 bars across the take
  noiseBins: boolean[];
};

export function analyse(samples: Sample[], bars = 30): TakeStats {
  const metered = samples.some((s) => s.db > -159);
  const pre = samples.filter((s) => s.t < 0 && s.db > -159).map((s) => s.db);
  const floorDb = pre.length ? Math.max(-70, pre.reduce((a, b) => a + b, 0) / pre.length) : -60;
  const post = samples.filter((s) => s.t >= 0);
  const voicedMark = floorDb + recording.speechAboveNoiseDb;
  const voiced = post.filter((s) => s.db > voicedMark);
  const totalSeconds = post.length ? post[post.length - 1].t : 0;
  const peakDb = post.reduce((m, s) => Math.max(m, s.db), -160);
  const voicedAvgDb = voiced.length ? voiced.reduce((a, s) => a + s.db, 0) / voiced.length : -160;
  const speechSeconds = voiced.length ? voiced[voiced.length - 1].t - voiced[0].t : 0;
  const bins: number[] = [];
  const noiseBins: boolean[] = [];
  const n = post.length || 1;
  for (let b = 0; b < bars; b++) {
    const slice = post.slice(Math.floor((b * n) / bars), Math.max(Math.floor(((b + 1) * n) / bars), Math.floor((b * n) / bars) + 1));
    const m = slice.reduce((mx, s) => Math.max(mx, s.db), -160);
    bins.push(levelFromDb(m));
    noiseBins.push(m <= voicedMark);
  }
  return { floorDb, peakDb, voicedAvgDb, speechSeconds, totalSeconds, heardSpeech: voiced.length > 0, metered, bins, noiseBins };
}

/** First problem found, or null. "short" is only a soft prompt and never blocks. */
export function judge(s: TakeStats): CoachKind | null {
  if (!s.metered) return null;
  if (!s.heardSpeech || s.peakDb < recording.tooQuietPeakDbfs) return 'quiet';
  if (s.peakDb >= recording.clippedPeakDb) return 'loud';
  if (s.voicedAvgDb - s.floorDb < recording.minSpeechOverNoiseDb) return 'noisy';
  if (s.speechSeconds < recording.tooShortSeconds) return 'short';
  return null;
}
