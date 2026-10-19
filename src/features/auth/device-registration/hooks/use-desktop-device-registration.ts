import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useDesktopDeviceRegistration() {
  const isDesktop = typeof window !== 'undefined' && Boolean(window.api?.device);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const register = useCallback(async (email: string, password: string) => {
    if (!window.api?.device) return;
    setLoading(true);
    try {
      const next = await window.api.device.register(email, password);
      setStatus(next);
      toast.info(`Device ${next?.replaceAll('_', ' ') ?? 'not registered'}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Device registration failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  const check = useCallback(async () => {
    if (!window.api?.device) return;
    setLoading(true);
    try {
      setStatus(await window.api.device.status());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not check device status.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { isDesktop, status, loading, register, check };
}
