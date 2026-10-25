import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { dark, light, type Palette } from '@/theme';

export type Appearance = 'system' | 'light' | 'dark';

type Ctx = {
  palette: Palette;
  isDark: boolean;
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
};

const KEY = 'voicecheck.appearance';
const ThemeCtx = createContext<Ctx>({
  palette: light,
  isDark: false,
  appearance: 'system',
  setAppearance: () => {},
});

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [appearance, setAppearanceState] = useState<Appearance>('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setAppearanceState(v);
      })
      .catch(() => {});
  }, []);

  const setAppearance = useCallback((a: Appearance) => {
    setAppearanceState(a);
    AsyncStorage.setItem(KEY, a).catch(() => {});
  }, []);

  const value = useMemo<Ctx>(() => {
    const isDark = appearance === 'system' ? system === 'dark' : appearance === 'dark';
    return { palette: isDark ? dark : light, isDark, appearance, setAppearance };
  }, [appearance, system, setAppearance]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useAppTheme = () => useContext(ThemeCtx);
