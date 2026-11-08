import { useEffect, useState } from 'react';
import { getRemainingSeconds } from '../utils';

/** Seconds left before the OTP expires, ticking once a second. */
export function useOtpCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(expiresAt, Date.now()));

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(getRemainingSeconds(expiresAt, Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
}
