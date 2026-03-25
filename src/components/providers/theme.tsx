import { createContext, useContext, useEffect, useMemo } from 'react';
import {
  useAppearanceStore,
  type ThemeMode,
  type AppearanceStyle,
  type BaseColor,
  type ThemeColor,
  type ChartColor,
  type RadiusPreset,
  type FontPreset,
  type HeadingPreset,
} from '@/stores/appearance-store';
import { buildAppearanceCssVars } from '@/features/appearance/shadcn-appearance';

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeProviderState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  style: AppearanceStyle;
  setStyle: (style: AppearanceStyle) => void;
  baseColor: BaseColor;
  setBaseColor: (baseColor: BaseColor) => void;
  themeColor: ThemeColor;
  setThemeColor: (themeColor: ThemeColor) => void;
  chartColor: ChartColor;
  setChartColor: (chartColor: ChartColor) => void;
  radius: RadiusPreset;
  setRadius: (radius: RadiusPreset) => void;
  font: FontPreset;
  setFont: (font: FontPreset) => void;
  heading: HeadingPreset;
  setHeading: (heading: HeadingPreset) => void;
};

const initialState: ThemeProviderState = {
  theme: 'dark',
  setTheme: () => null,
  style: 'mira',
  setStyle: () => null,
  baseColor: 'neutral',
  setBaseColor: () => null,
  themeColor: 'amber',
  setThemeColor: () => null,
  chartColor: 'blue',
  setChartColor: () => null,
  radius: 'default',
  setRadius: () => null,
  font: 'geist',
  setFont: () => null,
  heading: 'geist',
  setHeading: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const theme = useAppearanceStore((state) => state.theme);
  const style = useAppearanceStore((state) => state.style);
  const baseColor = useAppearanceStore((state) => state.baseColor);
  const themeColor = useAppearanceStore((state) => state.themeColor);
  const chartColor = useAppearanceStore((state) => state.chartColor);
  const radius = useAppearanceStore((state) => state.radius);
  const font = useAppearanceStore((state) => state.font);
  const heading = useAppearanceStore((state) => state.heading);
  const setTheme = useAppearanceStore((state) => state.setTheme);
  const setStyle = useAppearanceStore((state) => state.setStyle);
  const setBaseColor = useAppearanceStore((state) => state.setBaseColor);
  const setThemeColor = useAppearanceStore((state) => state.setThemeColor);
  const setChartColor = useAppearanceStore((state) => state.setChartColor);
  const setRadius = useAppearanceStore((state) => state.setRadius);
  const setFont = useAppearanceStore((state) => state.setFont);
  const setHeading = useAppearanceStore((state) => state.setHeading);

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = (nextTheme: ThemeMode) => {
      const resolved = nextTheme === 'system' ? (media.matches ? 'dark' : 'light') : nextTheme;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);

      const { lightVars, darkVars, effectiveRadius } = buildAppearanceCssVars({
        style,
        baseColor,
        themeColor,
        chartColor,
        radius,
      });

      const selectedVars = resolved === 'dark' ? darkVars : lightVars;
      Object.entries(selectedVars).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });

      const fontValue =
        font === 'geist'
          ? "'Geist', 'Inter Variable', 'Manrope Variable', ui-sans-serif, system-ui, sans-serif"
          : font === 'inter'
            ? "'Inter Variable', 'Geist', 'Manrope Variable', ui-sans-serif, system-ui, sans-serif"
            : font === 'manrope'
              ? "'Manrope Variable', 'Inter Variable', 'Geist', ui-sans-serif, system-ui, sans-serif"
              : 'ui-sans-serif, system-ui, -apple-system, sans-serif';

      const headingValue =
        heading === 'geist'
          ? "'Geist', 'Inter Variable', ui-sans-serif, system-ui, sans-serif"
          : heading === 'manrope'
            ? "'Manrope Variable', 'Inter Variable', ui-sans-serif, system-ui, sans-serif"
            : heading === 'serif'
              ? "'Iowan Old Style', 'Palatino', 'Times New Roman', serif"
              : 'ui-sans-serif, system-ui, -apple-system, sans-serif';

      root.style.setProperty('--font-sans', fontValue);
      root.style.setProperty('--font-heading', headingValue);

      root.setAttribute('data-style', style);
      root.setAttribute('data-base-color', baseColor);
      root.setAttribute('data-theme-color', themeColor);
      root.setAttribute('data-chart-color', chartColor);
      root.setAttribute('data-radius', effectiveRadius);
      root.setAttribute('data-font', font);
      root.setAttribute('data-heading', heading);

      body.classList.remove('style-vega', 'style-nova', 'style-maia', 'style-lyra', 'style-mira');
      body.classList.add(`style-${style}`);
    };

    apply(theme);

    const onSystemThemeChange = () => apply(theme);
    media.addEventListener('change', onSystemThemeChange);

    return () => {
      media.removeEventListener('change', onSystemThemeChange);
    };
  }, [baseColor, chartColor, font, heading, radius, style, theme, themeColor]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      style,
      setStyle,
      baseColor,
      setBaseColor,
      themeColor,
      setThemeColor,
      chartColor,
      setChartColor,
      radius,
      setRadius,
      font,
      setFont,
      heading,
      setHeading,
    }),
    [
      baseColor,
      chartColor,
      setBaseColor,
      setChartColor,
      setRadius,
      setStyle,
      setTheme,
      setThemeColor,
      setFont,
      setHeading,
      radius,
      style,
      theme,
      themeColor,
      font,
      heading,
    ],
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
