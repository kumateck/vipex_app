import { createNavigationContainerRef, type ParamListBase } from '@react-navigation/native';
import { resolveMobileHref, type MobileHrefObject } from './navigation-route-resolver';

export const navigationRef = createNavigationContainerRef<ParamListBase>();

function runWhenReady(action: () => void) {
  if (navigationRef.isReady()) action();
  else setTimeout(() => runWhenReady(action), 0);
}

export const router = {
  push(href: string | MobileHrefObject) {
    const route = resolveMobileHref(href);
    runWhenReady(() => navigationRef.navigate(route.name, route.params));
  },
  replace(href: string | MobileHrefObject) {
    const route = resolveMobileHref(href);
    runWhenReady(() =>
      navigationRef.reset({ index: 0, routes: [{ name: route.name, params: route.params }] }),
    );
  },
  back() {
    runWhenReady(() => {
      if (navigationRef.canGoBack()) navigationRef.goBack();
    });
  },
};

export function routeFromHref(href: string | MobileHrefObject) {
  return resolveMobileHref(href);
}
