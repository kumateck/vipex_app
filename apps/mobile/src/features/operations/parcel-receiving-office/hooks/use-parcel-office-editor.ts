import { useState } from 'react';
import { editableParcelOffice } from '@/shared/shipments/receiving-office';
import { useAuth } from '@mobile/providers/auth-provider';
import { canViewReceiveScreen } from '@mobile/lib/permissions';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { ParcelFullDetails } from '@mobile/types/parcels';
import { assignReceivingOffice } from '../services';
import { useReceivingOfficeChoice } from './use-receiving-office-choice';

export function useParcelOfficeEditor(parcel: ParcelFullDetails['parcel'], onSaved: () => void) {
  const { session, withAuth } = useAuth();
  const branchId = session.user?.branch?.id ?? session.user?.branchId;
  const allowed =
    branchId === parcel.destinationId && canViewReceiveScreen(session.user?.permissions);
  const assignment = allowed ? editableParcelOffice(parcel) : null;
  const office = useReceivingOfficeChoice({
    enabled: Boolean(assignment),
    locationId: parcel.pickupLocationId,
    initialOfficeId: assignment?.officeId,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!assignment || saving || !office.officeId || office.officeId === assignment.officeId)
      return;
    setSaving(true);
    try {
      await withAuth((token) =>
        assignReceivingOffice(token, parcel.id, office.officeId, assignment.officeId),
      );
      notifySuccess('Receiving office updated');
      onSaved();
    } catch (error) {
      notifyError(
        'Update failed',
        getMobileErrorMessage(error, 'Could not update receiving office'),
      );
    } finally {
      setSaving(false);
    }
  }

  return { assignment, office, save, saving };
}
