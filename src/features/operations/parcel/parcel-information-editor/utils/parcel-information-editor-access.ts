import { PermissionKeys } from '@/shared/permissions/constants';
import type { EditableParcelInformation } from '../types';

export function getParcelInformationEditorAccess(
  parcel: Pick<EditableParcelInformation, 'sourceId' | 'isDeleted'>,
  user: { branchId?: string | null; permissions: readonly string[] },
) {
  const canEdit = Boolean(
    user.branchId &&
      parcel.sourceId === user.branchId &&
      !parcel.isDeleted &&
      user.permissions.includes(PermissionKeys.CanUpdateParcels),
  );
  return {
    canEdit,
    canEditReceiver: canEdit && user.permissions.includes(PermissionKeys.CanUpdateCustomers),
  };
}
