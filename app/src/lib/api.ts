// Client for the scoring server (api/main.py). Contract:
//   POST /quality  multipart: task, clip            -> QualityResult
//   POST /score    multipart: clips (filename <task>.<ext>, one per task) -> ScoreResult
// Auth: Authorization: Bearer <Firebase ID token>.
// Mock mode (no EXPO_PUBLIC_API_URL, or EXPO_PUBLIC_MOCK_API=1) lets the whole flow run without the server.
import { File, Paths } from 'expo-file-system';

import { auth } from '@/lib/firebase';
import { type TaskKey } from '@/lib/tasks';

export type Band = 'low' | 'borderline' | 'elevated';

export type QualityResult = {
  ok: boolean;
  reason: string | null; // plain-language re-record advice, show as-is
  duration: number;
  voiced_duration: number;
  peak: number;
  snr_db: number | null;
};

export type Metrics = {
  pitch_hz: number | null;
  pitch_variability_semitones: number | null;
  jitter_percent: number | null;
  shimmer_percent: number | null;
  hnr_db: number | null;
  vowel_duration_s: number | null;
  syllable_rate_per_s: number | null;
  syllable_regularity_cv: number | null;
  pause_ratio: number | null;
};

export type ScoreResult = {
  band: Band;
  model_score: number; // never shown as a % or probability; PDF technical appendix only
  metrics: Metrics;
  top_factors: { feature: string; direction: 'toward_als' | 'toward_typical'; weight: number }[];
  quality_warnings: Partial<Record<TaskKey, string>>;
  model_version: string;
  sample_rate_hz: number;
};

export type Clip = { task: TaskKey; uri: string };

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
export const isMockApi = !BASE || process.env.EXPO_PUBLIC_MOCK_API === '1';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth?.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function extOf(uri: string) {
  const m = uri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  return (m ? m[1] : 'wav').toLowerCase();
}

/**
 * Expo's fetch (SDK 58) only accepts `File` objects as multipart parts, not the old
 * `{ uri, name, type }` shape. The server reads the task from the filename, so each recording is
 * copied to a temporary file called `<task>.<ext>`. Temporary copies are deleted after the upload.
 */
async function filePart(task: TaskKey, uri: string, temps: File[]): Promise<File> {
  const copy = new File(Paths.cache, `${task}.${extOf(uri)}`);
  if (copy.exists) copy.delete();
  await new File(uri).copy(copy);
  temps.push(copy);
  return copy;
}

async function post<T>(path: string, form: FormData, temps: File[]): Promise<T> {
  try {
    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, { method: 'POST', headers: await authHeaders(), body: form });
    } catch (e) {
      console.warn(`[api] ${path} could not connect to ${BASE}:`, e);
      throw e;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[api] ${path} -> HTTP ${res.status}: ${body.slice(0, 300)}`);
      throw new Error(`Server error ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    for (const f of temps) {
      try { if (f.exists) f.delete(); } catch { /* best effort */ }
    }
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function checkQuality(task: TaskKey, uri: string, localDurationS: number): Promise<QualityResult> {
  if (isMockApi) {
    await wait(400);
    return { ok: true, reason: null, duration: localDurationS, voiced_duration: localDurationS, peak: 0.5, snr_db: 25 };
  }
  const temps: File[] = [];
  const form = new FormData();
  form.append('task', task);
  form.append('clip', await filePart(task, uri, temps));
  return post<QualityResult>('/quality', form, temps);
}

export async function scoreClips(clips: Clip[]): Promise<ScoreResult> {
  if (isMockApi) {
    await wait(2500);
    const bands: Band[] = ['low', 'borderline', 'elevated'];
    const band = bands[Math.floor(Math.random() * 3)];
    return {
      band,
      model_score: band === 'low' ? 0.2 : band === 'borderline' ? 0.5 : 0.8,
      metrics: {
        pitch_hz: 180, pitch_variability_semitones: 1.1 + Math.random(), jitter_percent: 0.6,
        shimmer_percent: 3.1, hnr_db: 18, vowel_duration_s: 6.2,
        syllable_rate_per_s: 5.2 + Math.random(), syllable_regularity_cv: 0.12, pause_ratio: 0.08,
      },
      top_factors: [],
      quality_warnings: {},
      model_version: 'mock',
      sample_rate_hz: 8000,
    };
  }
  const temps: File[] = [];
  const form = new FormData();
  for (const c of clips) form.append('clips', await filePart(c.task, c.uri, temps));
  return post<ScoreResult>('/score', form, temps);
}
