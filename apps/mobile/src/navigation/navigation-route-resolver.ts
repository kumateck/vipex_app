export type MobileHrefObject = {
  pathname?: string;
  params?: Record<string, unknown>;
};

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
  '/super-search/[parcelId]': 'SuperSearchRecord',
  '/queue': 'Queue',
  '/receive': 'Receive',
  '/(app)/global-search': 'SuperSearch',
  '/(app)/super-search': 'SuperSearch',
  '/(app)/parcel-create': 'ParcelCreate',
  '/(app)/queue': 'Queue',
  '/(app)/receive': 'Receive',
  '/(app)/receive-consignments': 'ReceiveConsignments',
  '/(app)/self-service': 'SelfService',
  '/(app)/call-center-follow-up': 'CallCenterFollowUp',
  '/(app)/receive-discrepancies': 'ReceiveDiscrepancies',
  '/(app)/delivery-change-reviews': 'DeliveryChangeReviews',
  '/(app)/customers': 'Customers',
  '/(app)/receive-consignment/[consignmentId]': 'ReceiveConsignment',
  '/(app)/rider': 'Rider',
  '/(app)/rider-assigned': 'RiderAssigned',
  '/(app)/rider-history': 'RiderHistory',
  '/(app)/change-password': 'ChangePassword',
  '/(app)/cashier-sales-report': 'CashierSalesReport',
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

export function resolveMobileHref(href: string | MobileHrefObject) {
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
  const consignmentMatch = normalizedPath.match(/^\/\(app\)\/receive-consignment\/([^/]+)$/);
  if (consignmentMatch) {
    return {
      name: 'ReceiveConsignment',
      params: { ...params, consignmentId: consignmentMatch[1] },
    };
  }
  const parcelMatch = normalizedPath.match(/^\/\(app\)\/super-search\/([^/]+)$/);
  if (parcelMatch)
    return { name: 'SuperSearchRecord', params: { ...params, parcelId: parcelMatch[1] } };

  return { name: routeMap[normalizedPath] ?? 'AppTabs', params };
}
