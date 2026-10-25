// Firestore: users/{uid}/tests/{id} holds band, measurements and date only. Audio is never stored.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, Timestamp,
} from 'firebase/firestore';

import type { Band, Metrics } from '@/lib/api';
import { db } from '@/lib/firebase';
import type { TaskKey } from '@/lib/tasks';

export type PreScreen = {
  sedatives: boolean; // alcohol or sedatives in the last 4 hours
  soreThroat: boolean; // cold, sore throat or hoarse voice
  tired: boolean; // very tired or unwell today
  noisyPlace: boolean; // noisy place
};

export type TestRecord = {
  id: string;
  createdAt: Date;
  band: Band;
  modelScore: number; // PDF technical appendix only, never shown in the app
  metrics: Partial<Metrics>;
  qualityWarnings: Partial<Record<TaskKey, string>>;
  modelVersion: string;
  preScreen?: PreScreen;
};

function need() {
  if (!db) throw new Error('Firebase is not configured. Fill in the EXPO_PUBLIC_FIREBASE_* values in .env.');
  return db;
}

const testsCol = (uid: string) => collection(need(), 'users', uid, 'tests');

/** Firestore rejects undefined, so drop it. */
function clean<T extends object>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

export async function saveResult(uid: string, r: Omit<TestRecord, 'id' | 'createdAt'>): Promise<TestRecord> {
  const createdAt = new Date();
  const ref = await addDoc(testsCol(uid), clean({ ...r, createdAt: Timestamp.fromDate(createdAt) }));
  return { ...r, id: ref.id, createdAt };
}

function fromDoc(id: string, d: Record<string, any>): TestRecord {
  return {
    id,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
    band: d.band,
    modelScore: d.modelScore ?? 0,
    metrics: d.metrics ?? {},
    qualityWarnings: d.qualityWarnings ?? {},
    modelVersion: d.modelVersion ?? '',
    preScreen: d.preScreen,
  };
}

export async function listResults(uid: string): Promise<TestRecord[]> {
  const snap = await getDocs(query(testsCol(uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}

export async function getResult(uid: string, id: string): Promise<TestRecord | null> {
  const snap = await getDoc(doc(need(), 'users', uid, 'tests', id));
  return snap.exists() ? fromDoc(snap.id, snap.data()) : null;
}

export async function deleteAllResults(uid: string): Promise<void> {
  const snap = await getDocs(testsCol(uid));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export async function deleteProfile(uid: string): Promise<void> {
  await deleteDoc(doc(need(), 'users', uid)).catch(() => {});
  await AsyncStorage.removeItem(`voicecheck.consent.${uid}`).catch(() => {});
}

// Consent: users/{uid}.consentAt, with a local copy so the app still opens offline.
export async function hasConsented(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(need(), 'users', uid));
    const yes = Boolean(snap.exists() && snap.data().consentAt);
    if (yes) await AsyncStorage.setItem(`voicecheck.consent.${uid}`, '1');
    return yes || (await AsyncStorage.getItem(`voicecheck.consent.${uid}`)) === '1';
  } catch {
    return (await AsyncStorage.getItem(`voicecheck.consent.${uid}`)) === '1';
  }
}

export async function saveConsent(uid: string): Promise<void> {
  await AsyncStorage.setItem(`voicecheck.consent.${uid}`, '1').catch(() => {});
  await setDoc(doc(need(), 'users', uid), { consentAt: Timestamp.now() }, { merge: true }).catch(() => {});
}
