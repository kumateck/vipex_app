import { mobileApiGet } from '@mobile/lib/api';
import type { LocationOption } from '@mobile/types/booking';

export function listReceivingLocations(
  token: string,
  input: { companyId: string; branchId: string },
) {
  return mobileApiGet<LocationOption[]>({
    path: '/locations/options',
    token,
    query: { ...input, canReceive: true },
  });
}
