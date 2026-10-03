import { useEffect, useState, type ReactNode } from 'react';
import { api, clearApiInFlightRequests } from '@/services/api';
import { store } from '@/store';
import { useAuthStore } from '@/stores/auth-store';
import { hasDesktopDeviceAccess } from '../services/device-access.api';

export function DesktopDeviceGate({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const isDesktopRuntime =
    typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron/');

  useEffect(() => {
    if (!isDesktopRuntime || !accessToken) return;
    let active = true;
    const check = async () => {
      const access = await hasDesktopDeviceAccess(accessToken).catch(() => false);
      if (!active) return;
      if (!access) {
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
  }, [accessToken, isDesktopRuntime]);

  if (isDesktopRuntime && accessToken && verifiedToken !== accessToken) {
    return <div className="p-6 text-sm">Checking company device policy…</div>;
  }
  return children;
}
