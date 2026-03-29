# Creatable Combobox (ShadCN Native)

This project includes a reusable, typed creatable combobox built on ShadCN primitives.

- Component: [src/components/ui/creatable-combobox.tsx](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/components/ui/creatable-combobox.tsx)
- Hook: [src/hooks/use-creatable-combobox.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/hooks/use-creatable-combobox.ts)
- Command primitive: [src/components/ui/command.tsx](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/components/ui/command.tsx)
- Usage examples: [src/components/ui/creatable-combobox.examples.tsx](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/components/ui/creatable-combobox.examples.tsx)

## Design Goals

- ShadCN-native UI: `Popover` + `Command` + `Button` composition.
- Generic typing for reusable option models.
- Supports both:
  - Sync mode (client-side filtering).
  - Async mode (server-side search).
- Supports creation flow:
  - Create new item when no exact match exists.
  - Auto-select newly created option.
- Form-friendly:
  - Works with React Hook Form `FormField`.
  - Works with RTK Query by injecting `fetchOptions`.

## Public API

```ts
type BaseOption = Record<string, unknown>;
type CreateStrategy = 'inline' | 'modal';

type CreatableComboboxProps<T extends BaseOption> = {
  value?: string;
  onChange: (value: string, option?: T) => void;

  getLabel: (item: T) => string;
  getValue: (item: T) => string;

  options?: T[]; // sync
  fetchOptions?: (query: string) => Promise<T[]>; // async
  onCreate?: (input: string) => Promise<T>; // both modes
  allowCreate?: boolean; // default: true

  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  createStrategy?: CreateStrategy; // default: inline
  className?: string;
  debounceMs?: number; // default: 300
};
```

## How Mode Detection Works

- Async mode is active when `fetchOptions` is provided.
- Sync mode is used when `fetchOptions` is omitted.

Internally:

- Sync mode filters `options` locally with case-insensitive label/value matching.
- Async mode debounces query input, calls `fetchOptions`, and protects against stale responses.

## Behavior Details

### Sync Mode

- Uses `options` as source of truth.
- Filters locally using input substring matching.
- Matching is case-insensitive.

### Async Mode

- Debounce default: `300ms` (`debounceMs` override supported).
- Shows loading state while searching.
- On request errors, shows graceful inline error.
- Merges fetched options with locally created options.

### Create Flow

- Create action appears only when both are true:
  - `onCreate` is provided.
  - `allowCreate` is `true` (default).
- Disabled when:
  - Input is empty/whitespace.
  - A case-insensitive exact match already exists (label or value).
  - Creation is already in progress.
- On successful create:
  - Adds item to local option cache.
  - Calls `onChange(getValue(newItem), newItem)`.
  - Closes popover and clears input.

### Select-Only Mode

Use this when you want search + selection without allowing new entries:

```tsx
<CreatableCombobox
  value={value}
  onChange={setValue}
  options={cities}
  getLabel={(item) => item.name}
  getValue={(item) => item.id}
  allowCreate={false}
/>
```

### Keyboard and Selection

- Uses `cmdk` navigation via ShadCN `Command`.
- Enter behavior:
  - If options are visible, normal command selection behavior applies.
  - If no options are visible and create is enabled, Enter triggers create.
  - In select-only mode (`allowCreate={false}`), Enter never triggers create.
- Selected option is indicated with a `Check` icon.

## Duplicate Prevention Rules

- Values are deduplicated case-insensitively (`getValue(item)` normalized).
- Create availability checks exact matches case-insensitively against both:
  - `getLabel(item)`
  - `getValue(item)`

## React Hook Form Integration

```tsx
<FormField
  control={form.control}
  name="city"
  render={({ field }) => (
    <CreatableCombobox
      value={field.value}
      onChange={(nextValue) => field.onChange(nextValue)}
      options={cities}
      getLabel={(item) => item.name}
      getValue={(item) => item.id}
      onCreate={createCity}
    />
  )}
/>
```

## RTK Query Integration

Inject async search as `fetchOptions`:

```tsx
const [triggerSearch] = useLazySearchCitiesQuery();

<CreatableCombobox
  value={value}
  onChange={setValue}
  fetchOptions={async (query) => {
    const result = await triggerSearch(query).unwrap();
    return result.items;
  }}
  onCreate={createCity}
  getLabel={(item) => item.name}
  getValue={(item) => item.id}
/>;
```

## Styling and System Compliance

- Uses `cn()` class merging.
- Uses ShadCN/Tailwind design tokens (`bg-popover`, `text-muted-foreground`, etc).
- Trigger uses `Button variant="outline"`.
- Popover width follows trigger width for consistent layout:
  - `w-[var(--radix-popover-trigger-width)]`.

## Optional Create Strategy

- `inline` (default): create action is shown as `CommandItem`.
- `modal`: currently stubbed as a disabled item for future modal workflow extension.

## Notes

- `cmdk` is required by the `Command` primitive and is included in dependencies.
- `CreatableCombobox` is exported from [src/components/ui/index.ts](/Users/gigisiri/Business/Employment/vipex/vipex_app/src/components/ui/index.ts).
