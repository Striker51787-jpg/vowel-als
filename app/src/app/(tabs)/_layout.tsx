import { Tabs } from 'expo-router';

import { TabBar } from '@/components/tabbar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="results" />
      <Tabs.Screen name="learn" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
