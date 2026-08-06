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
    separator: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    primary: string;
    primaryText: string;
    secondary: string;
    secondaryText: string;
    danger: string;
    warning: string;
    success: string;
    inputBg: string;
    inputText: string;
    inputPlaceholder: string;
    indicatorOnline: string;
    indicatorMuted: string;
  };
};

const lightPalette = {
  bg: '#F2F2F7',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardMuted: '#F8F8FA',
  border: '#D1D1D6',
  separator: 'rgba(60,60,67,0.29)',
  text: '#1C1C1E',
  textMuted: '#636366',
  textSubtle: '#8E8E93',
  primary: '#D6402C',
  primaryText: '#FFFFFF',
  secondary: '#3E63DD',
  secondaryText: '#FFFFFF',
  danger: '#D70015',
  warning: '#C26900',
  success: '#248A3D',
  inputBg: '#F2F2F7',
  inputText: '#1C1C1E',
  inputPlaceholder: '#8E8E93',
  indicatorOnline: '#248A3D',
  indicatorMuted: '#AEAEB2',
};

const darkPalette = {
  bg: '#000000',
  bgElevated: '#1C1C1E',
  card: '#1C1C1E',
  cardMuted: '#2C2C2E',
  border: '#38383A',
  separator: 'rgba(84,84,88,0.6)',
  text: '#F2F2F7',
  textMuted: '#AEAEB2',
  textSubtle: '#8E8E93',
  primary: '#FF6B52',
  primaryText: '#0A0C10',
  secondary: '#7C97FF',
  secondaryText: '#0A0C10',
  danger: '#FF453A',
  warning: '#FF9F0A',
  success: '#30D158',
  inputBg: '#2C2C2E',
  inputText: '#F2F2F7',
  inputPlaceholder: '#8E8E93',
  indicatorOnline: '#30D158',
  indicatorMuted: '#636366',
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
