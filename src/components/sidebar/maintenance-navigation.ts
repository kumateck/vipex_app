import { isSystemAdminRoleName, MAINTENANCE_PATH } from '@/shared/maintenance';
import type { Route } from './navigation';

export function withMaintenanceNavigation(routes: Route[], roleName?: string | null): Route[] {
  if (!isSystemAdminRoleName(roleName)) return routes;
  const entry = { title: 'Maintenance Scripts', url: MAINTENANCE_PATH, icon: 'Wrench' as const };
  const exists = routes.some((group) => group.menu.some((item) => item.url === MAINTENANCE_PATH));
  if (exists) return routes;
  if (!routes.some((group) => group.title === 'Technology'))
    return [...routes, { title: 'Technology', menu: [entry] }];
  return routes.map((group) =>
    group.title === 'Technology' ? { ...group, menu: [...group.menu, entry] } : group,
  );
}
