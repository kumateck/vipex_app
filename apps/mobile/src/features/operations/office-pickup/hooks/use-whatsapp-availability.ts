import { useEffect, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { getWhatsAppAvailability } from '../services';

/**
 * Whether staff may pick WhatsApp for the OTP. Any failure means "not
 * available", so the screen falls back to SMS exactly as before.
 */
export function useWhatsAppAvailability() {
  const { withAuth } = useAuth();
  const [isWhatsAppAvailable, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    withAuth((token) => getWhatsAppAvailability(token))
      .then((result) => {
        if (active) setAvailable(Boolean(result?.available));
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, [withAuth]);

  return isWhatsAppAvailable;
}
