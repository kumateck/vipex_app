import type { AppearanceMode } from '@mobile/lib/storage';

export type ThemeScheme = 'light' | 'dark';

export type AppTheme = {
  scheme: ThemeScheme;
  mode: AppearanceMode;
  statusBarStyle: 'dark' | 'light';
  colors: {
    bg: string;
    bgElevated: string;
    card: string;
    cardMuted: string;
    border: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    primary: string;
    primaryText: string;
    danger: string;
    success: string;
    inputBg: string;
    inputText: string;
    inputPlaceholder: string;
  };
};

const lightPalette = {
  bg: '#F3F5FA',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardMuted: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#334155',
  textSubtle: '#64748B',
  primary: '#C05500',
  primaryText: '#FFFFFF',
  danger: '#B42318',
  success: '#067647',
  inputBg: '#FFFFFF',
  inputText: '#0F172A',
  inputPlaceholder: '#94A3B8',
};

const darkPalette = {
  bg: '#060A12',
  bgElevated: '#0C1323',
  card: '#111827',
  cardMuted: '#0F172A',
  border: '#1F2937',
  text: '#E2E8F0',
  textMuted: '#CBD5E1',
  textSubtle: '#94A3B8',
  primary: '#F97316',
  primaryText: '#111827',
  danger: '#EF4444',
  success: '#22C55E',
  inputBg: '#0B1220',
  inputText: '#E2E8F0',
  inputPlaceholder: '#64748B',
};

export function createTheme(mode: AppearanceMode, scheme: ThemeScheme): AppTheme {
  const palette = scheme === 'dark' ? darkPalette : lightPalette;
  return {
    scheme,
    mode,
    statusBarStyle: scheme === 'dark' ? 'light' : 'dark',
    colors: palette,
  };
}
