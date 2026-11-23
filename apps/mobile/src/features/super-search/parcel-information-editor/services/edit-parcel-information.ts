import { mobileApiPost } from '@mobile/lib/api';
import type { ParcelInformationEdit } from '@/shared/shipments/parcel-information-edit';

export function editParcelInformation(token: string, { id, ...body }: ParcelInformationEdit) {
  return mobileApiPost<{ id: string }>({
    path: `/shipments/parcels/${id}/edit-information`,
    token,
    body,
  });
}
