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
  bg: '#F4F6FB',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardMuted: '#EEF2F8',
  border: '#D7DEE8',
  text: '#142847',
  textMuted: '#3B4F72',
  textSubtle: '#7184A6',
  primary: '#C83D2F',
  primaryText: '#FFFFFF',
  secondary: '#1C315B',
  secondaryText: '#FFFFFF',
  danger: '#B42318',
  warning: '#B88100',
  success: '#138C5A',
  inputBg: '#FFFFFF',
  inputText: '#142847',
  inputPlaceholder: '#8C9BB5',
  indicatorOnline: '#00C982',
  indicatorMuted: '#A1ACBF',
};

const darkPalette = {
  bg: '#070C16',
  bgElevated: '#0F1D38',
  card: '#131F37',
  cardMuted: '#0A162C',
  border: '#23365D',
  text: '#E6EEFA',
  textMuted: '#C4D3EA',
  textSubtle: '#95A9CC',
  primary: '#E45443',
  primaryText: '#FFFFFF',
  secondary: '#203864',
  secondaryText: '#E6EEFA',
  danger: '#F97066',
  warning: '#F6C453',
  success: '#2BC67A',
  inputBg: '#0A162C',
  inputText: '#E6EEFA',
  inputPlaceholder: '#7388AB',
  indicatorOnline: '#19D88C',
  indicatorMuted: '#62789B',
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
