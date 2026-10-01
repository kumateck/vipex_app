import { useEffect, useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { listBranchOptions, listLocationOptions } from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import type { BranchOption, LocationOption } from '@mobile/types/booking';

export function useParcelBranchOptions(
  companyId: string | null,
  destinationBranchId: string,
  canCreate: boolean,
  isHeadOffice: boolean,
) {
  const { withAuth } = useAuth();
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

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
  }, [companyId, canCreate, isHeadOffice, withAuth]);

  useEffect(() => {
    if (!companyId || !destinationBranchId) {
      setLocationOptions([]);
      return;
    }
    let cancelled = false;
    setIsLoadingLocations(true);
    withAuth((token) => listLocationOptions(token, { companyId, branchId: destinationBranchId }))
      .then((options) => {
        if (!cancelled) setLocationOptions(options);
      })
      .catch((error) => {
        notifyError(
          'Failed to load locations',
          getMobileErrorMessage(error, '') || 'Please try again',
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLocations(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, destinationBranchId, withAuth]);

  return { branchOptions, isLoadingBranches, locationOptions, isLoadingLocations };
}
