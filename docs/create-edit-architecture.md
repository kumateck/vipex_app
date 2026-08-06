# Create/Edit Architecture Rules

## Decision rule

- Use a `dialog` for short create flows (quick fields, low context).
- Use a dedicated `page` for long create flows (multi-section forms, dependencies, or review steps).
- Dialog flows may still use `/new` routes for deep linking, but the UI surface should be a dialog overlay.
- When both create and edit exist, routes must share one route-level component:
  - `/entity/new`
  - `/entity/edit/:id`

Both routes should export the same `*CreateEditPage` component, and that component decides mode from params.

## Route standards

- Canonical create route: `/new`
- Legacy create route: `/create` is allowed only as a redirect to `/new`.
- Shared route-level component pattern:

```tsx
import { EntityCreateEditPage } from '@/features/entity';

export default EntityCreateEditPage;
```

## Enforcement

Run:

```bash
bun run lint:architecture
```

This check enforces:

- every `/new` route declares an explicit surface policy (`dialog` or `page`);
- entities with both `/new` and `/edit/[id]` share the same route component export;
- legacy `/create` routes are redirects to `/new`.
