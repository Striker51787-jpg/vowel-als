import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';

export default function Index() {
  const { user, consented } = useAuth();
  if (!user) return <Redirect href="/welcome" />;
  return <Redirect href={consented ? '/home' : '/consent'} />;
}
