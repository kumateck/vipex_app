# Appearance System (Current Implementation)

This document describes the current live appearance implementation.

## Scope

The appearance system controls:

- Theme mode (`dark`, `light`, `system`)
- Style preset (`vega`, `nova`, `maia`, `lyra`, `mira`)
- Base color
- Theme color
- Chart color
- Radius preset
- Body font preset
- Heading font preset

All settings apply instantly across the app and persist in browser storage.

## Source Files

Core implementation files:

- `src/stores/appearance-store.ts`
- `src/components/providers/theme.tsx`
- `src/features/appearance/shadcn-appearance.ts`
- `src/features/appearance/shadcn-themes.ts`
- `src/features/appearance/config.ts`
- `src/pages/(private)/settings/appearance/page.tsx`
- `styles/globals.css`
- `styles/shadcn-style-recipes/style-vega.css`
- `styles/shadcn-style-recipes/style-nova.css`
- `styles/shadcn-style-recipes/style-maia.css`
- `styles/shadcn-style-recipes/style-lyra.css`
- `styles/shadcn-style-recipes/style-mira.css`

## Persistence

Store key:

- `vipex-appearance-storage`

State is persisted with Zustand `persist` and is not cleared on logout.

Persisted values:

- `theme`
- `style`
- `baseColor`
- `themeColor`
- `chartColor`
- `radius`
- `font`
- `heading`

Defaults:

- `theme: dark`
- `style: vega`
- `baseColor: neutral`
- `themeColor: amber`
- `chartColor: blue`
- `radius: default`
- `font: geist`
- `heading: geist`

Hydration behavior:

- Persisted values are normalized.
- Invalid values are replaced by defaults.
- Legacy `shape` values are migrated to `radius`.
- Appearance page controls are prepopulated from persisted/default values.

## Runtime Application

`ThemeProvider` (`src/components/providers/theme.tsx`) applies all appearance settings to the document in one effect:

- Resolves active theme (`dark`, `light`, or system-resolved).
- Sets `html` class (`dark` or `light`).
- Computes merged CSS variables from base/theme/chart + radius logic.
- Writes CSS vars to `:root`.
- Applies font tokens:
  - `--font-sans`
  - `--font-heading`
- Sets diagnostic attributes on `html`:
  - `data-style`, `data-base-color`, `data-theme-color`, `data-chart-color`, `data-radius`, `data-font`, `data-heading`
- Applies body style class:
  - `style-vega`, `style-nova`, `style-maia`, `style-lyra`, or `style-mira`

## Token Merge Rules

Implemented in `src/features/appearance/shadcn-appearance.ts`.

Merge order:

1. Base color tokens
2. Theme color tokens
3. Chart color override (`chart-1` through `chart-5`)
4. Radius application

Radius behavior:

- Both light and dark tokens receive the same resolved radius.
- `lyra` forces effective radius to `none`.

## Fonts and Typography

Font loading is defined in `styles/globals.css` with `@font-face`:

- Geist variable
- Inter Variable
- Manrope Variable

Typography variables:

- `--font-sans` is used by body and general UI text.
- `--font-heading` is applied to headings and title slots.

Heading usage is enforced in base CSS for:

- `h1` to `h6`
- key title slots such as `card-title`, `dialog-title`, `alert-dialog-title`, `sheet-title`, `drawer-title`, `table-head`, `field-legend`

## Style Recipes and Component Hooks

Shadcn style recipe files are imported in `styles/globals.css` and keyed by body class.

Component hook coverage currently includes:

- `Button`: `cn-button`, `cn-button-variant-*`, `cn-button-size-*`
- `Badge`: `cn-badge`, `cn-badge-variant-*`
- `Card`: `cn-card`, `cn-card-header`, `cn-card-title`, `cn-card-description`, `cn-card-content`, `cn-card-footer`

Important implementation detail:

- Core primitives were de-hardcoded so recipe styles control spacing, font size, and radius per style preset.

## Appearance Page

Route:

- `/settings/appearance`

Page file:

- `src/pages/(private)/settings/appearance/page.tsx`

Current UI behavior:

- Theme mode quick actions (`dark`, `light`, `system`)
- Compact style cards with mini real component previews
- Compact base/theme/chart color chips
- Select controls for:
  - Radius
  - Font
  - Heading
- Live preview section including typography sample
- Reset-to-defaults action

All controls update the entire app instantly.

## Validation

Current verification commands:

- `bunx tsc --noEmit`
- `bun run build`
