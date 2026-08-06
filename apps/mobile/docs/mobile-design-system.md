# Mobile Design System (Vipex)

## Principles

- Operational first: fastest path to scan, queue, dispatch, and deliver.
- Role-aware by default: users only see tools they can execute.
- Consistent surfaces: every screen uses the same card, input, and spacing language.
- Status by signal: prefer compact visual indicators (dot/badge) over noisy connection text.

## Theme Tokens

Use semantic tokens from `@mobile/providers/appearance-provider` and do not hardcode brand shades in screens.

- `colors.primary` / `colors.primaryText`
- `colors.bg` / `colors.bgElevated`
- `colors.card` / `colors.cardMuted`
- `colors.text` / `colors.textMuted` / `colors.textSubtle`
- `colors.border`
- `colors.success` / `colors.warning` / `colors.danger`

### Light/Dark

- Light is default.
- Dark uses the same semantic token names; only values change.
- Every component must consume semantic tokens only.

## Layout Tokens

From `@mobile/theme/layout`:

- Spacing: `mobileSpacing.*` (4/8-based rhythm)
- Radius: `mobileRadius.*`
- Type scale: `mobileTypography.*`

## Core Mobile Components

From `@/components/ui/mobile`:

- `AppCard`
- `AppButton` (`primary`, `secondary`)
- `AppInput`
- `PasswordInput` (show/hide toggle)
- `AppLabel`
- `AppStatusChip`
- `AppSkeletonCard`
- `MobileNoAccess`

## Navigation Contract

Bottom tabs are role + permission driven.

Base tabs:

- Dashboard
- Parcels
- Chat
- Profile

Conditional tabs:

- Queue: only if queue permission AND user is not rider.
- Scan: only if receive permission AND user is not rider.

### Rider Policy

Rider must not see:

- Queue tab
- Scan QR tab

Rider should only see delivery-relevant workflow tabs plus shared tabs (Dashboard/Parcels/Chat/Profile).

## Communication UX Contract

### Thread list + thread page

- Show unread counts and recent activity.
- Show connection using a compact dot indicator.
- Do not render explicit “online/offline” labels in thread headers.

### Voice

- Show media/realtime health with indicator + concise label.
- Keep reconnect warnings contextual and temporary.

## States

Every screen must handle:

- Loading: skeletons/placeholders.
- Empty: guided copy + next action.
- Error: clear reason + retry action.

## Accessibility

- Touch targets >= 44px.
- Text and icon contrast must remain AA-compliant in both themes.
- Icon-only actions require `accessibilityLabel`.

## Naming Rules

- Files: `kebab-case`
- Components: `PascalCase`
- Hooks: `use-*`
- Screen wrappers thin; business logic in hooks.

## Implementation Notes

- Never use native date input types in shared UI.
- Keep files <= 300 lines; split early.
- Reuse shared tokens/components before creating new variants.
