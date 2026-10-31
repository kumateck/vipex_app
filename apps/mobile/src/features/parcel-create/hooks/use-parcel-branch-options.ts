import { useEffect, useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { listBranchOptions } from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import type { BranchOption } from '@mobile/types/booking';
import { useReceivingLocationOptions } from './use-receiving-location-options';

export function useParcelBranchOptions(
  companyId: string | null,
  destinationBranchId: string,
  canCreate: boolean,
  isHeadOffice: boolean,
) {
  const { withAuth } = useAuth();
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const receiving = useReceivingLocationOptions(
    companyId,
    destinationBranchId,
    canCreate && !isHeadOffice,
  );
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!companyId || !canCreate || isHeadOffice) return;
    let cancelled = false;
    setIsLoadingBranches(true);
    withAuth((token) => listBranchOptions(token, { companyId }))
      .then((options) => {
        if (!cancelled) setBranchOptions(options);
      })
      .catch((error) => {
        notifyError(
          'Failed to load branches',
          getMobileErrorMessage(error, '') || 'Please try again',
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBranches(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, canCreate, isHeadOffice, withAuth, reloadKey]);

  return {
    branchOptions,
    isLoadingBranches,
    ...receiving,
    retry: () => {
      setReloadKey((current) => current + 1);
      receiving.retryLocations();
    },
  };
}
