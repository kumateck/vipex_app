import { PermissionKeys } from '@/shared/permissions/constants';
import { buildParcelInformationEdit } from '@/shared/shipments/parcel-information-edit';
import type {
  EditableParcelInformation,
  ParcelInformationActionProps,
  ParcelInformationValues,
} from '../types';

export function resolveEditableParcel({
  details,
  row,
}: Omit<ParcelInformationActionProps, 'onSaved'>) {
  const summary = details.summary?.id === details.parcel.id ? details.summary : row;
  const receiverAvailable = Boolean(
    summary?.id === details.parcel.id && summary.receiverId === details.parcel.receiverId,
  );
  return {
    ...details.parcel,
    isDeleted: Boolean(details.parcel.isDeleted || summary?.isDeleted),
    receiverName: receiverAvailable ? (summary?.receiverName ?? null) : null,
    receiverAvailable,
  } satisfies EditableParcelInformation;
}

export function getParcelInformationAccess(
  parcel: EditableParcelInformation,
  user: { branchId?: string | null; permissions?: readonly string[] },
) {
  const canEdit = Boolean(
    user.branchId &&
      (parcel.sourceId === user.branchId || parcel.destinationId === user.branchId) &&
      !parcel.isDeleted &&
      user.permissions?.includes(PermissionKeys.CanReadParcels) &&
      user.permissions.includes(PermissionKeys.CanUpdateParcels),
  );
  return {
    canEdit,
    canEditReceiver: Boolean(
      canEdit &&
        parcel.receiverAvailable &&
        user.permissions?.includes(PermissionKeys.CanUpdateCustomers),
    ),
  };
}

export function buildSuperSearchInformationEdit(
  original: EditableParcelInformation,
  values: ParcelInformationValues,
  canEditReceiver: boolean,
) {
  if (!values.parcelDetails.trim()) throw new Error('Parcel details is required.');
  if (values.parcelDetails.trim().length > 255)
    throw new Error('Parcel details must contain at most 255 characters.');
  // This editor never reads or writes telephone fields, even if the API adds them to details.
  const patch = buildParcelInformationEdit(
    {
      id: original.id,
      parcelDetails: original.parcelDetails,
      receiverId: original.receiverId,
      receiverName: original.receiverName,
    },
    { ...values, receiverPhone: '' },
  );
  if (patch?.receiver) {
    if (!canEditReceiver)
      throw new Error(
        'Update Customers permission and receiver details are required. Reload and try again.',
      );
    if (patch.receiver.fullname !== undefined && !patch.receiver.fullname)
      throw new Error('Receiver name is required.');
    if ((patch.receiver.fullname?.length ?? 0) > 255)
      throw new Error('Receiver name must contain at most 255 characters.');
  }
  return patch;
}
