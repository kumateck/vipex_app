# Sidebar System (Current Implementation)

This document describes the current live sidebar implementation and navigation behavior.

## Scope

The sidebar system handles:

- Sidebar shell and collapse behavior
- Grouped navigation rendering
- Permission-aware menu filtering
- Active route highlighting
- Parent section auto-open for active child routes

## Source Files

Core sidebar files:

- `src/components/sidebar/index.tsx`
- `src/components/sidebar/menu.tsx`
- `src/components/sidebar/navigation.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/layouts/auth.tsx`

## Navigation Data

`src/components/sidebar/navigation.tsx` defines static route groups (`ROUTES`) and menu items.

Structure:

- Route group (`title`, `menu[]`)
- Menu item (`title`, `url`, `icon`, optional `items[]`, optional `permissionKey`)
- Sub-item (`title`, `url`, optional `permissionKey`)

## Permission Filtering

Implemented in `src/components/sidebar/index.tsx` via `filterRoutesByPermissions(...)`.

Behavior:

- Reads allowed permissions from user state and read-only permissions query.
- Keeps only menu items and sub-items the user is allowed to access.
- Drops empty groups after filtering.

## Active Route Behavior

Implemented in `src/components/sidebar/menu.tsx`.

Current logic:

- Main item is active only on exact path match (`currentPath === item.url`).
- Sub-item is active only on exact path match (`currentPath === subItem.url`).
- Parent section auto-opens when any child matches active path.
- Parent open state is independent from active highlight.

Result:

- Only the current route is highlighted.
- Non-active siblings are not highlighted.

## Critical Active-State Fix

Implemented in `src/components/ui/sidebar.tsx`.

Fix:

- `data-active` is rendered only when active.
- Inactive items now omit the attribute entirely.

Why this matters:

- Recipe CSS uses attribute-presence selectors (`data-active:*`).
- Rendering `data-active="false"` incorrectly triggered active styles.

Current behavior now matches expected shadcn semantics.

## Sidebar UI Primitives

`src/components/ui/sidebar.tsx` provides:

- `SidebarProvider`
- `Sidebar`
- `SidebarInset`
- `SidebarMenu`, `SidebarMenuItem`
- `SidebarMenuButton`
- `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton`
- `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarRail`, `SidebarTrigger`

These primitives expose `data-slot` hooks used by the imported style recipes.

## Style Integration

Sidebar visuals come from the active style recipe (`style-vega`, `style-nova`, `style-maia`, `style-lyra`, `style-mira`) applied on `<body>` by theme provider.

Affected sidebar slots include:

- `sidebar-menu-button`
- `sidebar-menu-sub-button`
- group labels and separators
- active/hover/focus state styling

## Layout Integration

Authenticated shell uses sidebar in:

- `src/components/layouts/auth.tsx`

Current layout structure:

- `SidebarProvider`
- `AppSidebar` (`variant="inset"`)
- `SidebarInset` for page content + header

## Validation

Current verification commands:

- `bunx tsc --noEmit`
- `bun run build`
