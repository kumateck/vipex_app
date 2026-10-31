import { mobileApiPost } from '@mobile/lib/api';
import type { ParcelInformationEdit } from '@/shared/shipments/parcel-information-edit';

export function editIncomingParcelInformation(token: string, input: ParcelInformationEdit) {
  const { id, ...body } = input;
  return mobileApiPost<{ id: string }>({
    path: `/shipments/parcels/${id}/edit-information`,
    token,
    body,
  });
}
