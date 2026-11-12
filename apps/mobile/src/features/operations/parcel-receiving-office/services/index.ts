import { mobileApiGet, mobileApiPatch } from '@mobile/lib/api';
import type { ReceivingOfficeOption } from '@/shared/shipments/receiving-office';

export function listReceivingOfficeOptions(token: string) {
  return mobileApiGet<ReceivingOfficeOption[]>({
    path: '/locations/receiving-offices/options',
    token,
  });
}

export function assignReceivingOffice(token: string, parcelId: string, receivingOfficeId: string) {
  return mobileApiPatch<{ receivingOfficeId: string; receivingOfficeName: string }>({
    path: `/shipments/parcels/${parcelId}/receiving-office`,
    token,
    body: { receivingOfficeId },
  });
}
