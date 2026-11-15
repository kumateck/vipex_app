import { useEffect, useState } from 'react';

function secondsRemaining(resendAt: string) {
  return Math.max(0, Math.ceil((Date.parse(resendAt) - Date.now()) / 1000));
}

export function useBatchOtpResend(resendAt: string) {
  const [remaining, setRemaining] = useState(() => secondsRemaining(resendAt));
  useEffect(() => {
    const timer = setInterval(() => {
      const seconds = secondsRemaining(resendAt);
      setRemaining(seconds);
      if (!seconds) clearInterval(timer);
    }, 1_000);
    return () => clearInterval(timer);
  }, [resendAt]);
  return remaining;
}
