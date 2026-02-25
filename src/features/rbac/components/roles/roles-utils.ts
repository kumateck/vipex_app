import type { PermissionCatalogItem } from '../../api/rbac.api';

export function groupPermissions(items: PermissionCatalogItem[]) {
  const grouped = new Map<string, PermissionCatalogItem[]>();
  for (const item of items) {
    const group = grouped.get(item.group) ?? [];
    group.push(item);
    grouped.set(item.group, group);
  }
  return [...grouped.entries()];
}
