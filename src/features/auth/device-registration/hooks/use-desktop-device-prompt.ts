import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Desktop only: shows the header register icon while this installation has no stored device
// credential. Any stored credential (pending, approved, revoked, ...) counts as registered.
export function useDesktopDevicePrompt() {
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const device = typeof window !== 'undefined' ? window.api?.device : undefined;
    if (!device) return;
    let active = true;
    device
      .status()
      .then((status) => {
        if (active) setNeedsRegistration(status === null);
      })
      // A status error only happens with a stored credential, so the device is registered.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    if (!window.api?.device) return false;
    setRegistering(true);
    try {
      const status = await window.api.device.register(email, password);
      setNeedsRegistration(status === null);
      toast.success(
        status === 'approved'
          ? 'This device is registered and approved.'
          : 'Device registered. An administrator must approve it before verification is enabled.',
      );
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Device registration failed.');
      return false;
    } finally {
      setRegistering(false);
    }
  }, []);

  return { needsRegistration, registering, register };
}
