import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  editableParcelOffice,
  type ParcelOfficeAssignment,
} from '@/shared/shipments/receiving-office';
import { useAuthStore } from '@/stores/auth-store';
import { useAssignParcelReceivingOfficeMutation } from '../services';
import { useReceivingOfficeChoice } from './use-receiving-office-choice';

export type ParcelOfficeEditorInput = ParcelOfficeAssignment;

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
  const assignment = allowed ? editableParcelOffice(parcel) : null;
  const choice = useReceivingOfficeChoice({
    enabled: Boolean(assignment),
    locationId: parcel.pickupLocationId,
    initialOfficeId: assignment?.officeId,
  });
  const [assignOffice, { isLoading: saving }] = useAssignParcelReceivingOfficeMutation();

  async function save() {
    if (!assignment || saving || !choice.officeId || choice.officeId === assignment.officeId)
      return;
    try {
      await assignOffice({
        parcelId: parcel.id,
        receivingOfficeId: choice.officeId,
        expectedReceivingOfficeId: assignment.officeId,
      }).unwrap();
      toast.success('Receiving office updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update receiving office'));
    }
  }

  return { assignment, choice, save, saving };
}
