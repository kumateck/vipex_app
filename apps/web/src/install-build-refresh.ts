const BUILD_POLL_INTERVAL_MS = 60_000;
const AUTO_RELOAD_GUARD_KEY = 'vipex:proactive-build-reload-at';
const AUTO_RELOAD_GUARD_MS = 60_000;

function extractBuildId(html: string): string | null {
  const metaWithNameFirst = html.match(
    /<meta[^>]*name=["']x-app-build["'][^>]*content=["']([^"']+)["'][^>]*>/i,
  );
  if (metaWithNameFirst?.[1]) return metaWithNameFirst[1];

  const metaWithContentFirst = html.match(
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']x-app-build["'][^>]*>/i,
  );
  return metaWithContentFirst?.[1] ?? null;
}

async function fetchServerBuildId(): Promise<string | null> {
  const url = new URL('/index.html', window.location.origin);
  url.searchParams.set('__build_probe', String(Date.now()));

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!response.ok) return null;

  const html = await response.text();
  return extractBuildId(html);
}

function shouldAutoReloadNow(): boolean {
  const previousRaw = window.sessionStorage.getItem(AUTO_RELOAD_GUARD_KEY);
  const previous = previousRaw ? Number(previousRaw) : 0;
  if (!Number.isFinite(previous) || previous <= 0) return true;
  return Date.now() - previous > AUTO_RELOAD_GUARD_MS;
}

function triggerHardReload() {
  const now = Date.now();
  window.sessionStorage.setItem(AUTO_RELOAD_GUARD_KEY, String(now));
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('__hard_reload', String(now));
  window.location.replace(nextUrl.toString());
}

export function installBuildRefreshWatcher() {
  if (typeof window === 'undefined' || !import.meta.env.PROD) return () => undefined;

  let disposed = false;

  const checkForNewBuild = async () => {
    if (disposed) return;
    try {
      const serverBuildId = await fetchServerBuildId();
      if (!serverBuildId || serverBuildId === __APP_BUILD_ID__) return;
      if (!shouldAutoReloadNow()) return;
      triggerHardReload();
    } catch {
      // Ignore network/proxy hiccups; next poll or focus check will retry.
    }
  };

  const intervalId = window.setInterval(() => {
    void checkForNewBuild();
  }, BUILD_POLL_INTERVAL_MS);

  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      void checkForNewBuild();
    }
  };

  const onFocus = () => {
    void checkForNewBuild();
  };

  const onOnline = () => {
    void checkForNewBuild();
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onFocus);
  window.addEventListener('online', onOnline);

  // Run once shortly after boot.
  window.setTimeout(() => {
    void checkForNewBuild();
  }, 2000);

  return () => {
    disposed = true;
    window.clearInterval(intervalId);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('online', onOnline);
  };
}
