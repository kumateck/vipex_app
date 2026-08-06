import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
  type IndexRouteObject,
  type RouteObject,
} from 'react-router-dom';
import { routes } from '@/routes/generated';
import {
  DomainDashboardRoutePage,
  DomainModuleRoutePage,
} from '@/features/dashboard/domain-dashboard';

function isIndexRoute(route: RouteObject): route is IndexRouteObject {
  return route.index === true;
}

function appendDomainDashboardRoutes(items: RouteObject[]): RouteObject[] {
  return items.map((route) => {
    if (isIndexRoute(route)) return route;

    const children = route.children ? appendDomainDashboardRoutes(route.children) : route.children;
    if (route.id !== 'layout-1') {
      return children ? { ...route, index: false, children } : route;
    }

    const hasDomainDashboard = children?.some((child) => child.path === 'app/:domain/dashboard');
    const hasDomainModule = children?.some(
      (child) => child.path === 'app/:domain/:subdomain/:module',
    );

    const nextChildren = [...(children ?? [])];
    if (!hasDomainDashboard) {
      nextChildren.push({
        path: 'app/:domain/dashboard',
        Component: DomainDashboardRoutePage,
      });
    }
    if (!hasDomainModule) {
      nextChildren.push({
        path: 'app/:domain/:subdomain/:module',
        Component: DomainModuleRoutePage,
      });
    }

    return {
      ...route,
      index: false,
      children: nextChildren,
    };
  });
}

function isElectronRuntime() {
  if (typeof window === 'undefined') return false;

  const globalWindow = window as Window & {
    electronAPI?: unknown;
    process?: { type?: string; versions?: { electron?: string } };
  };

  if (globalWindow.electronAPI) return true;
  if (globalWindow.process?.type === 'renderer') return true;
  if (globalWindow.process?.versions?.electron) return true;

  return false;
}

const routeObjects = appendDomainDashboardRoutes(routes as RouteObject[]);
const router = isElectronRuntime()
  ? createHashRouter(routeObjects)
  : createBrowserRouter(routeObjects);

export function MainRoutes() {
  return <RouterProvider router={router} />;
}

export default MainRoutes;
