import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { getSavedParcelCallOutcome, type SavedParcelCallOutcome } from '@/shared/notification-hub';
import { getParcelCallResendTargetRepo } from '../parcel-call-resend.repository';
import { sendParcelStatusNotificationSvc } from './parcel-notifications.service';

export async function resendParcelCallNotificationSvc(input: {
  companyId: string;
  branchId: string;
  actorUserId: string;
  parcelId: string;
  expectedOutcome: SavedParcelCallOutcome;
  sendSms: boolean;
  sendEmail: boolean;
  includeSecondReceiver: boolean;
}) {
  if (!input.companyId || !input.branchId) throw BadRequest('Company and branch are required');
  if (!input.sendSms && !input.sendEmail) throw BadRequest('Select SMS or email to resend');
  const parcel = await getParcelCallResendTargetRepo(input.companyId, input.parcelId);
  if (
    !parcel ||
    parcel.isDeleted ||
    parcel.companyId !== input.companyId ||
    parcel.destinationId !== input.branchId ||
    parcel.callCenterAssignedToUserId !== input.actorUserId
  )
    throw NotFound('Assigned parcel not found at your branch');

  const outcome = getSavedParcelCallOutcome(parcel);
  if (!outcome || outcome !== input.expectedOutcome) {
    throw Conflict(
      'The saved call outcome has changed or is no longer available. Refresh the list.',
    );
  }

  // Notification-only: do not repeat the contact, receiver-change, or parcel-status mutation.
  return sendParcelStatusNotificationSvc({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    parcelId: input.parcelId,
    outcome,
    sendSms: input.sendSms,
    sendEmail: input.sendEmail,
    includeSecondReceiver: input.includeSecondReceiver,
    isResend: true,
  });
}
