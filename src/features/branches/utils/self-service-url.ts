interface SelfServiceUrlOptions {
  branchId: string;
  currentOrigin: string;
  developmentHost: string;
  isDevelopment: boolean;
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function buildSelfServiceUrl({
  branchId,
  currentOrigin,
  developmentHost,
  isDevelopment,
}: SelfServiceUrlOptions) {
  const url = new URL(currentOrigin);
  const localHost = developmentHost.trim();

  if (isDevelopment && localHost && LOOPBACK_HOSTS.has(url.hostname)) {
    url.hostname = localHost;
  }

  url.pathname = `/self-service/${encodeURIComponent(branchId)}`;
  url.search = '';
  url.searchParams.set('scan', '1');
  url.hash = '';
  return url.toString();
}
