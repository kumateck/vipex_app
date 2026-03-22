import type {
  AppearanceStyle,
  BaseColor,
  ChartColor,
  RadiusPreset,
  ThemeColor,
} from '@/stores/appearance-store';
import { SHADCN_THEMES } from '@/features/appearance/shadcn-themes';

type CssVars = Record<string, string>;
type ThemeEntry = (typeof SHADCN_THEMES)[number];

const BASE_COLOR_NAMES: ReadonlySet<BaseColor> = new Set([
  'neutral',
  'stone',
  'zinc',
  'mauve',
  'olive',
  'mist',
  'taupe',
]);

const RADIUS_VALUES: Record<RadiusPreset, string> = {
  default: '',
  none: '0',
  small: '0.45rem',
  medium: '0.625rem',
  large: '0.875rem',
};

const themeMap = new Map<string, ThemeEntry>(SHADCN_THEMES.map((theme) => [theme.name, theme]));

function getTheme(name: string) {
  return themeMap.get(name) ?? themeMap.get('neutral');
}

function toVars(vars?: Record<string, string>) {
  return { ...(vars ?? {}) };
}

export function getThemesForBaseColor(baseColor: BaseColor) {
  return SHADCN_THEMES.filter((theme) => {
    if (theme.name === baseColor) {
      return true;
    }

    return !BASE_COLOR_NAMES.has(theme.name as BaseColor);
  });
}

export function buildAppearanceCssVars({
  style,
  baseColor,
  themeColor,
  chartColor,
  radius,
}: {
  style: AppearanceStyle;
  baseColor: BaseColor;
  themeColor: ThemeColor;
  chartColor: ChartColor;
  radius: RadiusPreset;
}) {
  const base = getTheme(baseColor);
  const theme = getTheme(themeColor);
  const chart = getTheme(chartColor);

  const lightVars: CssVars = {
    ...toVars(base?.cssVars?.light),
    ...toVars(theme?.cssVars?.light),
  };

  const darkVars: CssVars = {
    ...toVars(base?.cssVars?.dark),
    ...toVars(theme?.cssVars?.dark),
  };

  const chartLight = toVars(chart?.cssVars?.light);
  const chartDark = toVars(chart?.cssVars?.dark);

  for (let i = 1; i <= 5; i += 1) {
    const key = `chart-${i}`;

    if (chartLight[key]) {
      lightVars[key] = chartLight[key];
    }

    if (chartDark[key]) {
      darkVars[key] = chartDark[key];
    }
  }

  const effectiveRadius = style === 'lyra' ? 'none' : radius;
  const radiusValue = RADIUS_VALUES[effectiveRadius];
  const baseLightVars = base?.cssVars?.light as Record<string, string> | undefined;
  const baseRadius = baseLightVars?.radius ?? '0.625rem';
  const appliedRadius = radiusValue || baseRadius;

  lightVars.radius = appliedRadius;
  darkVars.radius = appliedRadius;

  return {
    lightVars,
    darkVars,
    effectiveRadius,
  };
}
