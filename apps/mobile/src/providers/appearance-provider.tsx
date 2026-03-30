import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { loadAppearanceMode, saveAppearanceMode, type AppearanceMode } from '@/lib/storage';
import { createTheme, type AppTheme, type ThemeScheme } from '@/theme/tokens';

type AppearanceContextValue = {
  bootstrapped: boolean;
  mode: AppearanceMode;
  scheme: ThemeScheme;
  theme: AppTheme;
  setMode: (mode: AppearanceMode) => Promise<void>;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: PropsWithChildren) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [mode, setModeState] = useState<AppearanceMode>('system');
  const systemScheme = useColorScheme();
  const scheme: ThemeScheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  useEffect(() => {
    loadAppearanceMode()
      .then((stored) => setModeState(stored))
      .finally(() => setBootstrapped(true));
  }, []);

  const setMode = useCallback(async (next: AppearanceMode) => {
    setModeState(next);
    await saveAppearanceMode(next);
  }, []);

  const theme = useMemo(() => createTheme(mode, scheme), [mode, scheme]);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      bootstrapped,
      mode,
      scheme,
      theme,
      setMode,
    }),
    [bootstrapped, mode, scheme, setMode, theme],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used within AppearanceProvider');
  return context;
}
