import { useCallback, useRef, useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import type {
  OtpAuthorizationTarget,
  PickupOtpAuthorization,
} from '@/shared/shipments/receiver-otp-exception';
import { getPickupOtpApproval } from '../services';

export function usePickupOtpApproval(parcelId: string | undefined, target: OtpAuthorizationTarget) {
  const { withAuth } = useAuth();
  const requestId = useRef(0);
  const [result, setResult] = useState<{
    key: string;
    approval: PickupOtpAuthorization | null;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const key = parcelId ? `${parcelId}:${target}` : '';
  const approval = result?.key === key ? result.approval : null;
  const reset = useCallback(() => {
    requestId.current += 1;
    setResult(null);
    setChecking(false);
  }, []);
  return {
    approval,
    checking,
    checked: result?.key === key,
    reset,
    check: async () => {
      if (!parcelId || checking) return;
      const id = ++requestId.current;
      setChecking(true);
      try {
        const { approval } = await withAuth((token) =>
          getPickupOtpApproval(token, parcelId, target),
        );
        if (id === requestId.current) setResult({ key, approval });
      } catch (error) {
        if (id !== requestId.current) return;
        setResult(null);
        notifyError('Unable to check admin approval', getMobileErrorMessage(error, 'Try again.'));
      } finally {
        if (id === requestId.current) setChecking(false);
      }
    },
  };
}
