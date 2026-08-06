import { createNavigationContainerRef, type ParamListBase } from '@react-navigation/native';

type HrefObject = {
  pathname?: string;
  params?: Record<string, unknown>;
};

export const navigationRef = createNavigationContainerRef<ParamListBase>();

const routeMap: Record<string, string> = {
  '/': 'Root',
  '/(auth)/login': 'Login',
  '/(auth)/forgot-password': 'ForgotPassword',
  '/(auth)/reset-password': 'ResetPassword',
  '/(auth)/set-password': 'SetPassword',
  '/(app)': 'AppTabs',
  '/(app)/(tabs)': 'AppTabs',
  '/(app)/(tabs)/index': 'HomeTab',
  '/(app)/(tabs)/chat': 'ChatTab',
  '/(app)/(tabs)/communication': 'CommunicationTab',
  '/(app)/(tabs)/operations': 'OperationsTab',
  '/(app)/(tabs)/parcels': 'ParcelsTab',
  '/(app)/(tabs)/profile': 'ProfileTab',
  '/(app)/(tabs)/queue': 'QueueTab',
  '/(app)/(tabs)/scan': 'ScanTab',
  '/chat': 'ChatTab',
  '/profile': 'ProfileTab',
  '/global-search': 'SuperSearch',
  '/super-search': 'SuperSearch',
  '/queue': 'Queue',
  '/receive': 'Receive',
  '/(app)/global-search': 'SuperSearch',
  '/(app)/super-search': 'SuperSearch',
  '/(app)/parcel-create': 'ParcelCreate',
  '/(app)/queue': 'Queue',
  '/(app)/receive': 'Receive',
  '/(app)/rider': 'Rider',
  '/(app)/rider-assigned': 'RiderAssigned',
  '/(app)/rider-history': 'RiderHistory',
  '/(app)/change-password': 'ChangePassword',
  '/communication/thread/[threadId]': 'CommunicationThread',
  '/communication/voice/[channelId]': 'VoiceChannel',
  '/(app)/communication/thread/[threadId]': 'CommunicationThread',
  '/(app)/communication/voice/[channelId]': 'VoiceChannel',
  '/(app)/super-search/[parcelId]': 'SuperSearchRecord',
  '/(app)/receive-process/[parcelId]': 'ReceiveProcess',
};

function normalizePath(path: string) {
  return path.replace(/\/+$/, '') || '/';
}

function parseHref(href: string | HrefObject) {
  if (typeof href !== 'string') {
    return {
      name: routeMap[normalizePath(href.pathname ?? '/')] ?? 'AppTabs',
      params: href.params ?? {},
    };
  }

  const [rawPath, query = ''] = href.split('?');
  const params = Object.fromEntries(new URLSearchParams(query).entries());
  const normalizedPath = normalizePath(rawPath);
  const receiveMatch = normalizedPath.match(/^\/\(app\)\/receive-process\/([^/]+)$/);
  if (receiveMatch)
    return { name: 'ReceiveProcess', params: { ...params, parcelId: receiveMatch[1] } };
  const parcelMatch = normalizedPath.match(/^\/\(app\)\/super-search\/([^/]+)$/);
  if (parcelMatch)
    return { name: 'SuperSearchRecord', params: { ...params, parcelId: parcelMatch[1] } };

  return { name: routeMap[normalizedPath] ?? 'AppTabs', params };
}

function runWhenReady(action: () => void) {
  if (navigationRef.isReady()) action();
  else setTimeout(() => runWhenReady(action), 0);
}

export const router = {
  push(href: string | HrefObject) {
    const route = parseHref(href);
    runWhenReady(() => navigationRef.navigate(route.name, route.params));
  },
  replace(href: string | HrefObject) {
    const route = parseHref(href);
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

export function routeFromHref(href: string | HrefObject) {
  return parseHref(href);
}
