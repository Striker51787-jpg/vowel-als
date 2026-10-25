import {
  createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, onAuthStateChanged,
  reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth, firebaseConfigured } from '@/lib/firebase';
import { deleteAllResults, deleteProfile, hasConsented, saveConsent } from '@/lib/store';

type Ctx = {
  user: User | null;
  ready: boolean; // auth state known
  consented: boolean | null; // null while loading
  displayName: string;
  signUp: (email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
  giveConsent: () => Promise<void>;
  deleteMyResults: () => Promise<void>;
  deleteMyAccount: (password: string) => Promise<void>;
};

const AuthCtx = createContext<Ctx>(null as unknown as Ctx);

function nameFrom(user: User | null) {
  if (!user) return '';
  if (user.displayName) return user.displayName.split(' ')[0];
  const local = (user.email ?? '').split('@')[0].split(/[._-]/)[0];
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : '';
}

function need() {
  if (!auth) throw new Error('Firebase is not configured. Fill in the EXPO_PUBLIC_FIREBASE_* values in .env.');
  return auth;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseConfigured);
  const [consented, setConsented] = useState<boolean | null>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setConsented(null);
      setReady(true);
      if (u) hasConsented(u.uid).then(setConsented);
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user, ready, consented,
      displayName: nameFrom(user),
      signUp: async (email, password) => {
        await createUserWithEmailAndPassword(need(), email.trim(), password);
      },
      logIn: async (email, password) => {
        await signInWithEmailAndPassword(need(), email.trim(), password);
      },
      resetPassword: (email) => sendPasswordResetEmail(need(), email.trim()),
      logOut: () => signOut(need()),
      giveConsent: async () => {
        if (!user) return;
        await saveConsent(user.uid);
        setConsented(true);
      },
      deleteMyResults: async () => {
        if (user) await deleteAllResults(user.uid);
      },
      deleteMyAccount: async (password) => {
        if (!user || !user.email) return;
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
        await deleteAllResults(user.uid);
        await deleteProfile(user.uid);
        await deleteUser(user);
      },
    }),
    [user, ready, consented],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

/** Maps Firebase error codes to plain-language messages (no red, no jargon). */
export function authMessage(e: unknown, mode: 'login' | 'signup' | 'reset' = 'login'): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code === 'auth/email-already-in-use') return 'There is already an account with that email. Try logging in instead.';
  if (code === 'auth/weak-password') return 'Choose a password with at least 8 characters.';
  if (code === 'auth/invalid-email') return 'That email does not look right. Check it and try again.';
  if (code === 'auth/network-request-failed') return 'We could not reach the internet. Check your connection and try again.';
  if (code === 'auth/too-many-requests') return 'Too many tries. Wait a few minutes, or reset your password.';
  if (mode === 'login') return 'That email and password do not match. Check them and try again, or reset your password.';
  if (!firebaseConfigured) return 'The app is not connected to Firebase yet. Add the Firebase values to the .env file.';
  return 'Something went wrong. Please try again.';
}
