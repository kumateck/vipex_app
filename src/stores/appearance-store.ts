import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APPEARANCE_STORAGE_KEY } from '@/features/appearance/config';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AppearanceStyle = 'vega' | 'nova' | 'maia' | 'lyra' | 'mira';
export type BaseColor = 'neutral' | 'stone' | 'zinc' | 'mauve' | 'olive' | 'mist' | 'taupe';
export type ThemeColor =
  | 'amber'
  | 'blue'
  | 'cyan'
  | 'emerald'
  | 'fuchsia'
  | 'green'
  | 'indigo'
  | 'lime'
  | 'orange'
  | 'pink'
  | 'purple'
  | 'red'
  | 'rose'
  | 'sky'
  | 'teal'
  | 'violet'
  | 'yellow';
export type ChartColor = ThemeColor;
export type RadiusPreset = 'default' | 'none' | 'small' | 'medium' | 'large';
export type FontPreset = 'geist' | 'inter' | 'system' | 'manrope';
export type HeadingPreset = 'geist' | 'manrope' | 'serif' | 'system';

interface AppearanceState {
  theme: ThemeMode;
  style: AppearanceStyle;
  baseColor: BaseColor;
  themeColor: ThemeColor;
  chartColor: ChartColor;
  radius: RadiusPreset;
  font: FontPreset;
  heading: HeadingPreset;
  setTheme: (theme: ThemeMode) => void;
  setStyle: (style: AppearanceStyle) => void;
  setBaseColor: (baseColor: BaseColor) => void;
  setThemeColor: (themeColor: ThemeColor) => void;
  setChartColor: (chartColor: ChartColor) => void;
  setRadius: (radius: RadiusPreset) => void;
  setFont: (font: FontPreset) => void;
  setHeading: (heading: HeadingPreset) => void;
  reset: () => void;
}

type LegacyShapePreset = 'rounded' | 'comfortable' | 'compact';

const DEFAULT_APPEARANCE = {
  theme: 'dark' as ThemeMode,
  style: 'vega' as AppearanceStyle,
  baseColor: 'neutral' as BaseColor,
  themeColor: 'amber' as ThemeColor,
  chartColor: 'blue' as ChartColor,
  radius: 'default' as RadiusPreset,
  font: 'geist' as FontPreset,
  heading: 'geist' as HeadingPreset,
};

const THEME_MODES: readonly ThemeMode[] = ['dark', 'light', 'system'];
const APPEARANCE_STYLES: readonly AppearanceStyle[] = ['vega', 'nova', 'maia', 'lyra', 'mira'];
const BASE_COLORS: readonly BaseColor[] = [
  'neutral',
  'stone',
  'zinc',
  'mauve',
  'olive',
  'mist',
  'taupe',
];
const COLOR_OPTIONS: readonly ThemeColor[] = [
  'amber',
  'blue',
  'cyan',
  'emerald',
  'fuchsia',
  'green',
  'indigo',
  'lime',
  'orange',
  'pink',
  'purple',
  'red',
  'rose',
  'sky',
  'teal',
  'violet',
  'yellow',
];
const RADIUS_PRESETS: readonly RadiusPreset[] = ['default', 'none', 'small', 'medium', 'large'];
const FONT_PRESETS: readonly FontPreset[] = ['geist', 'inter', 'system', 'manrope'];
const HEADING_PRESETS: readonly HeadingPreset[] = ['geist', 'manrope', 'serif', 'system'];

function toRadiusFromLegacyShape(shape: unknown): RadiusPreset {
  if (shape === 'compact') return 'small';
  if (shape === 'comfortable') return 'medium';
  if (shape === 'rounded') return 'large';
  return DEFAULT_APPEARANCE.radius;
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && options.includes(value as T);
}

function normalizeAppearance(
  input: Partial<AppearanceState> & { shape?: LegacyShapePreset } = {},
): Pick<
  AppearanceState,
  'theme' | 'style' | 'baseColor' | 'themeColor' | 'chartColor' | 'radius' | 'font' | 'heading'
> {
  const fallbackRadius = input.shape
    ? toRadiusFromLegacyShape(input.shape)
    : DEFAULT_APPEARANCE.radius;

  return {
    theme: isOneOf(input.theme, THEME_MODES) ? input.theme : DEFAULT_APPEARANCE.theme,
    style: isOneOf(input.style, APPEARANCE_STYLES) ? input.style : DEFAULT_APPEARANCE.style,
    baseColor: isOneOf(input.baseColor, BASE_COLORS)
      ? input.baseColor
      : DEFAULT_APPEARANCE.baseColor,
    themeColor: isOneOf(input.themeColor, COLOR_OPTIONS)
      ? input.themeColor
      : DEFAULT_APPEARANCE.themeColor,
    chartColor: isOneOf(input.chartColor, COLOR_OPTIONS)
      ? input.chartColor
      : DEFAULT_APPEARANCE.chartColor,
    radius: isOneOf(input.radius, RADIUS_PRESETS) ? input.radius : fallbackRadius,
    font: isOneOf(input.font, FONT_PRESETS) ? input.font : DEFAULT_APPEARANCE.font,
    heading: isOneOf(input.heading, HEADING_PRESETS) ? input.heading : DEFAULT_APPEARANCE.heading,
  };
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      ...DEFAULT_APPEARANCE,
      setTheme: (theme) => set({ theme }),
      setStyle: (style) => set({ style }),
      setBaseColor: (baseColor) => set({ baseColor }),
      setThemeColor: (themeColor) => set({ themeColor }),
      setChartColor: (chartColor) => set({ chartColor }),
      setRadius: (radius) => set({ radius }),
      setFont: (font) => set({ font }),
      setHeading: (heading) => set({ heading }),
      reset: () => set(DEFAULT_APPEARANCE),
    }),
    {
      name: APPEARANCE_STORAGE_KEY,
      version: 2,
      migrate: (persistedState) => {
        const state =
          (persistedState as Partial<AppearanceState> & { shape?: LegacyShapePreset }) ?? {};
        return normalizeAppearance(state);
      },
      merge: (persistedState, currentState) => {
        const state =
          (persistedState as Partial<AppearanceState> & { shape?: LegacyShapePreset }) ?? {};
        return {
          ...currentState,
          ...normalizeAppearance(state),
        };
      },
    },
  ),
);
