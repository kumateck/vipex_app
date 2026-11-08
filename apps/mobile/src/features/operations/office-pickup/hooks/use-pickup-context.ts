import { useMemo } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import type { PickupContext } from '../types';

/** Company, branch and location of the signed-in staff member (stable identity). */
export function usePickupContext(): PickupContext {
  const { session } = useAuth();
  const user = session.user;
  const companyId = user?.company?.id ?? user?.companyId ?? null;
  const branchId = user?.branch?.id ?? user?.branchId ?? null;
  const locationId = user?.location?.id ?? null;
  const locationName = user?.location?.name ?? null;

  return useMemo(
    () => ({ companyId, branchId, locationId, locationName }),
    [branchId, companyId, locationId, locationName],
  );
}
