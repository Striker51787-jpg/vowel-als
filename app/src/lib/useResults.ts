import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { listResults, type TestRecord } from '@/lib/store';

/** Loads the signed-in user's results (newest first) every time the screen gains focus. */
export function useResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<TestRecord[] | null>(null);
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      if (!user) return;
      listResults(user.uid)
        .then((r) => { if (live) { setResults(r); setFailed(false); } })
        .catch(() => { if (live) { setFailed(true); setResults((p) => p ?? []); } });
      return () => { live = false; };
    }, [user]),
  );
  return { results, failed };
}
