import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/components/providers/theme';
import type {
  AppearanceStyle,
  BaseColor,
  ChartColor,
  FontPreset,
  HeadingPreset,
  RadiusPreset,
  ThemeColor,
} from '@/stores/appearance-store';
import { useAppearanceStore } from '@/stores/appearance-store';
import { SHADCN_THEMES } from '@/features/appearance/shadcn-themes';
import {
  BASE_COLOR_OPTIONS,
  CHART_COLOR_OPTIONS,
  COLOR_OPTIONS,
  FONT_OPTIONS,
  HEADING_OPTIONS,
  RADIUS_OPTIONS,
  STYLE_OPTIONS,
  THEME_MODE_OPTIONS,
} from '@/features/appearance/config';
import { cn } from '@/lib/utils';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

const colorByName = new Map<string, string>(
  SHADCN_THEMES.map((theme) => [
    theme.name as string,
    (theme.cssVars?.light?.primary as string | undefined) ?? 'oklch(0.65 0 0)',
  ]),
);

function ColorChip({
  label,
  value,
  selected,
  onClick,
}: {
  label: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}) {
  const swatch = colorByName.get(value) ?? 'oklch(0.65 0 0)';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-9 items-center gap-2 rounded-md border px-2 text-left text-[11px] transition ${
        selected ? 'border-primary ring-1 ring-primary/50' : 'border-border hover:border-primary/50'
      }`}
      aria-pressed={selected}
      title={label}
    >
      <span
        className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20"
        style={{ backgroundColor: swatch }}
      />
      <span className="truncate text-xs">{label}</span>
      {selected ? <Check className="ml-auto size-3.5 text-primary" /> : null}
    </button>
  );
}

export default function AppearancePage() {
  const {
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
  } = useTheme();
  const resetAppearance = useAppearanceStore((state) => state.reset);

  return (
    <ScrollableWrapper>
      <div className="mx-auto w-full max-w-full p-4 py-1">
        <Card>
          <CardHeader className="pb-1.5">
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Compact workspace styling. Changes apply instantly across the application.
            </CardDescription>

            <CardAction>
              <Button type="button" size="sm" variant="outline" onClick={resetAppearance}>
                Reset to defaults
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <section className="space-y-2 rounded-lg border border-border p-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Theme
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_MODE_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={theme === option.value ? 'default' : 'outline'}
                      onClick={() => setTheme(option.value)}
                      className="h-8 justify-start text-xs"
                    >
                      {theme === option.value ? <Check className="size-4" /> : null}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </section>
              <section className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="appearance-radius"
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    Radius
                  </Label>
                  <Select
                    value={radius}
                    onValueChange={(value) => setRadius(value as RadiusPreset)}
                  >
                    <SelectTrigger id="appearance-radius" className="h-8">
                      <SelectValue placeholder="Select radius" />
                    </SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="appearance-font"
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    Font
                  </Label>
                  <Select value={font} onValueChange={(value) => setFont(value as FontPreset)}>
                    <SelectTrigger id="appearance-font" className="h-8">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="appearance-heading"
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    Heading
                  </Label>
                  <Select
                    value={heading}
                    onValueChange={(value) => setHeading(value as HeadingPreset)}
                  >
                    <SelectTrigger id="appearance-heading" className="h-8">
                      <SelectValue placeholder="Select heading font" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEADING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>
            </div>

            <section className="space-y-2 rounded-lg border border-border p-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Style</Label>
              <div className="grid gap-2 md:grid-cols-5">
                {STYLE_OPTIONS.map((option) => {
                  const selected = style === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStyle(option.value as AppearanceStyle)}
                      className={`rounded-lg border p-2 text-left transition ${
                        selected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/50'
                          : 'border-border hover:border-primary/50'
                      }`}
                      aria-pressed={selected}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{option.label}</span>
                        {selected ? <span className="text-[10px] text-primary">Active</span> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {option.description}
                      </p>
                      <div className={`style-${option.value} mt-2`}>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div
                            data-slot="button"
                            data-variant="default"
                            data-size="xs"
                            className={cn(
                              'cn-button cn-button-size-xs cn-button-variant-default pointer-events-none w-full px-0',
                              selected ? 'opacity-100' : 'opacity-85',
                            )}
                          />
                          <div
                            data-slot="button"
                            data-variant="outline"
                            data-size="xs"
                            className="cn-button cn-button-size-xs cn-button-variant-outline pointer-events-none w-full px-0"
                          />
                          <div
                            data-slot="button"
                            data-variant="secondary"
                            data-size="xs"
                            className="cn-button cn-button-size-xs cn-button-variant-secondary pointer-events-none w-full px-0 opacity-80"
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-border p-3">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Base Color
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                  {BASE_COLOR_OPTIONS.map((option) => (
                    <ColorChip
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      selected={baseColor === option.value}
                      onClick={() => setBaseColor(option.value as BaseColor)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Theme Color
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 md:grid-cols-9">
                  {COLOR_OPTIONS.map((option) => (
                    <ColorChip
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      selected={themeColor === option.value}
                      onClick={() => setThemeColor(option.value as ThemeColor)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Chart Color
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 md:grid-cols-9">
                  {CHART_COLOR_OPTIONS.map((option) => (
                    <ColorChip
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      selected={chartColor === option.value}
                      onClick={() => setChartColor(option.value as ChartColor)}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-2 rounded-lg border border-border bg-card p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Preview</p>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="font-heading text-base font-semibold text-foreground">
                  Typography preview
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The quick brown fox jumps over the lazy dog.
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-2 rounded-md border border-border bg-background p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Workspace settings</p>
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
                      Active
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Primary</Button>
                    <Button size="sm" variant="secondary">
                      Secondary
                    </Button>
                    <Button size="sm" variant="outline">
                      Accent
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 rounded-md border border-border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">All systems normal</p>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full w-2/3 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
