export function resolveMnotifyApiRoot(configuredUrl: string) {
  const url = new URL(configuredUrl.trim() || 'https://api.mnotify.com/api');
  url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/sms\/quick$/, '');
  if (url.hostname === 'api.mnotify.com' && !url.pathname.replace(/\//g, '')) url.pathname = '/api';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/+$/, '');
}
