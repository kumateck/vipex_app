import type {
  AppearanceStyle,
  BaseColor,
  ChartColor,
  FontPreset,
  HeadingPreset,
  RadiusPreset,
  ThemeColor,
  ThemeMode,
} from '@/stores/appearance-store';

export const APPEARANCE_STORAGE_KEY = 'vipex-appearance-storage';

export const THEME_MODE_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

export const STYLE_OPTIONS: Array<{ value: AppearanceStyle; label: string; description: string }> =
  [
    { value: 'vega', label: 'Vega', description: 'The classic shadcn look.' },
    { value: 'nova', label: 'Nova', description: 'Reduced spacing for compact layouts.' },
    { value: 'maia', label: 'Maia', description: 'Soft and rounded with generous spacing.' },
    { value: 'lyra', label: 'Lyra', description: 'Boxy and sharp for structured surfaces.' },
    { value: 'mira', label: 'Mira', description: 'Dense UI tuned for data-heavy screens.' },
  ];

export const BASE_COLOR_OPTIONS: Array<{ value: BaseColor; label: string }> = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'stone', label: 'Stone' },
  { value: 'zinc', label: 'Zinc' },
  { value: 'mauve', label: 'Mauve' },
  { value: 'olive', label: 'Olive' },
  { value: 'mist', label: 'Mist' },
  { value: 'taupe', label: 'Taupe' },
];

export const COLOR_OPTIONS: Array<{ value: ThemeColor; label: string }> = [
  { value: 'amber', label: 'Amber' },
  { value: 'blue', label: 'Blue' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'fuchsia', label: 'Fuchsia' },
  { value: 'green', label: 'Green' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'lime', label: 'Lime' },
  { value: 'orange', label: 'Orange' },
  { value: 'pink', label: 'Pink' },
  { value: 'purple', label: 'Purple' },
  { value: 'red', label: 'Red' },
  { value: 'rose', label: 'Rose' },
  { value: 'sky', label: 'Sky' },
  { value: 'teal', label: 'Teal' },
  { value: 'violet', label: 'Violet' },
  { value: 'yellow', label: 'Yellow' },
];

export const CHART_COLOR_OPTIONS: Array<{ value: ChartColor; label: string }> = [...COLOR_OPTIONS];

export const RADIUS_OPTIONS: Array<{ value: RadiusPreset; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'none', label: 'None' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export const FONT_OPTIONS: Array<{ value: FontPreset; label: string }> = [
  { value: 'geist', label: 'Geist' },
  { value: 'inter', label: 'Inter' },
  { value: 'manrope', label: 'Manrope' },
  { value: 'system', label: 'System' },
];

export const HEADING_OPTIONS: Array<{ value: HeadingPreset; label: string }> = [
  { value: 'geist', label: 'Geist Heading' },
  { value: 'manrope', label: 'Manrope Heading' },
  { value: 'serif', label: 'Serif Heading' },
  { value: 'system', label: 'System Heading' },
];
