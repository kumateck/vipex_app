import { useEffect, useState } from 'react';
import { api, clearApiInFlightRequests } from '@/services/api';
import { store } from '@/store';
import { useAuthStore } from '@/stores/auth-store';
import { verifyDesktopDeviceAccess } from '../services';

type VerificationState = { token: string; status: 'allowed' | 'unavailable' };

export function useDesktopDeviceAccess() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const isDesktopRuntime =
    typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron/');

  useEffect(() => {
    if (!isDesktopRuntime || !accessToken) return;
    let active = true;
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        const result = await verifyDesktopDeviceAccess(accessToken);
        if (!active || useAuthStore.getState().accessToken !== accessToken) return;
        if (result === 'denied') {
          clearApiInFlightRequests();
          store.dispatch(api.util.resetApiState());
          useAuthStore.getState().logout();
          return;
        }
        if (result !== 'superseded') {
          setVerification({ token: accessToken, status: result });
        }
      } finally {
        checking = false;
      }
    };

    void check();
    const timer = window.setInterval(() => void check(), 60_000);
    window.addEventListener('focus', check);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', check);
    };
  }, [accessToken, isDesktopRuntime, retryVersion]);

  const isBlocked =
    isDesktopRuntime &&
    Boolean(accessToken) &&
    (verification?.token !== accessToken || verification.status !== 'allowed');
  const isUnavailable =
    verification?.token === accessToken && verification.status === 'unavailable';

  return {
    isBlocked,
    isUnavailable,
    retry: () => setRetryVersion((version) => version + 1),
  };
}
