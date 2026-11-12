import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { PermissionKeys } from '@/shared/permissions/constants';
import { canAssignReceivingOffice } from '@/shared/shipments/receiving-office';
import { useAuthStore } from '@/stores/auth-store';
import { useAssignParcelReceivingOfficeMutation } from '../services';
import { useReceivingOfficeChoice } from './use-receiving-office-choice';

export type ParcelOfficeEditorInput = {
  id: string;
  status: number;
  destinationId: string;
  pickupLocationId?: string | null;
  receivingOfficeId?: string | null;
  isDeleted?: boolean;
  confirmedAt?: string | null;
};

export function useParcelReceivingOffice(parcel: ParcelOfficeEditorInput) {
  const allowed = useAuthStore((state) => {
    const user = state.user;
    return (
      user?.branch?.id === parcel.destinationId &&
      Boolean(
        user?.permissions?.includes(PermissionKeys.CanReadParcelIncoming) ||
          user?.permissions?.includes(PermissionKeys.CanReadParcelScan),
      )
    );
  });
  const canEdit =
    allowed &&
    canAssignReceivingOffice(parcel.status) &&
    Boolean(parcel.pickupLocationId) &&
    !parcel.isDeleted &&
    !parcel.confirmedAt;
  const choice = useReceivingOfficeChoice({
    enabled: canEdit,
    locationId: parcel.pickupLocationId,
    initialOfficeId: parcel.receivingOfficeId,
  });
  const [assignOffice, { isLoading: saving }] = useAssignParcelReceivingOfficeMutation();

  async function save() {
    if (!choice.officeId || saving || !canEdit) return;
    try {
      await assignOffice({ parcelId: parcel.id, receivingOfficeId: choice.officeId }).unwrap();
      toast.success('Receiving office updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update receiving office'));
    }
  }

  return { canEdit, choice, save, saving };
}
