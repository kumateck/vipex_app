import { useCallback, useEffect, useState } from 'react';
import { registerMobileDevice } from '@mobile/lib/api';
import { loadDeviceCredential } from '@mobile/lib/device-registration';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { notifyError, notifySuccess } from '@mobile/lib/notify';

// Shows the header register icon while this phone has no stored device credential.
// Any stored credential (pending, approved, revoked, ...) counts as registered.
export function useMobileDevicePrompt() {
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    let active = true;
    loadDeviceCredential()
      .then((credential) => {
        if (active) setNeedsRegistration(!credential);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setRegistering(true);
    try {
      const status = await registerMobileDevice(email, password);
      setNeedsRegistration(false);
      notifySuccess(
        status === 'approved'
          ? 'This device is registered and approved.'
          : 'An administrator must approve it before device verification is enabled.',
        'Device registered',
      );
      return true;
    } catch (error) {
      notifyError(
        'Could not register device',
        getMobileErrorMessage(error, '') || 'Check your password and try again.',
      );
      return false;
    } finally {
      setRegistering(false);
    }
  }, []);

  return { needsRegistration, registering, register };
}
