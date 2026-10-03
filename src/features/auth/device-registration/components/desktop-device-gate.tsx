import { useEffect, useState, type ReactNode } from 'react';
import { api, clearApiInFlightRequests } from '@/services/api';
import { store } from '@/store';
import { useAuthStore } from '@/stores/auth-store';

export function DesktopDeviceGate({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const deviceApi = typeof window !== 'undefined' ? window.api?.device : undefined;
  const isDesktopRuntime =
    typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron/');

  useEffect(() => {
    if (!deviceApi || !accessToken) return;
    let active = true;
    const check = async () => {
      const status = await deviceApi.status().catch(() => null);
      if (!active) return;
      if (status !== 'approved') {
        clearApiInFlightRequests();
        store.dispatch(api.util.resetApiState());
        useAuthStore.getState().logout();
        return;
      }
      setVerifiedToken(accessToken);
    };
    void check();
    const timer = window.setInterval(() => void check(), 60_000);
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [accessToken, deviceApi]);

  if (isDesktopRuntime && !deviceApi) {
    return <div className="p-6 text-sm text-destructive">Desktop security bridge unavailable.</div>;
  }
  if (deviceApi && accessToken && verifiedToken !== accessToken) {
    return <div className="p-6 text-sm">Checking desktop device approval…</div>;
  }
  return children;
}
