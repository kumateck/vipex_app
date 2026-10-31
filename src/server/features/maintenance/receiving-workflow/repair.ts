import { Conflict } from '@/server/utils/http-error';
import {
  bookingRepairResult,
  writeBookingRepairAudit,
  type BookingOperation,
} from '../booking-operations';
import type { TaggedTransaction } from '../credit-repair';
import { planReceivingWorkflow } from './plan';
import { loadWorkflowEvidence, loadWorkflowParcel } from './repository';

export async function repairReceivingWorkflow(
  tx: TaggedTransaction,
  input: BookingOperation & { pickupLocationId?: string },
) {
  const parcel = await loadWorkflowParcel(tx, input);
  const evidence = await loadWorkflowEvidence(tx, input, parcel);
  const plan = planReceivingWorkflow(parcel, evidence, input.pickupLocationId);
  const details = {
    parcelId: parcel.id,
    bookingCode: parcel.booking_code,
    destinationId: parcel.destination_id,
    before: {
      pickupLocationId: parcel.pickup_location_id,
      status: parcel.status,
      receivedAt: parcel.received_at,
      confirmedAt: parcel.confirmed_at,
      deletedAt: parcel.deleted_at,
      callCenterAssignedToUserId: parcel.call_center_assigned_to_user_id,
      callCenterCalledAt: parcel.call_center_called_at,
      updatedAt: parcel.updated_at,
    },
    after: plan.after,
    changes: plan.changes,
    availableLocations: evidence.locations,
    latestStatusChange: evidence.latestStatusChange,
    deliveries: evidence.deliveries,
  };
  const result = bookingRepairResult(
    details,
    plan.restriction,
    plan.needsRepair,
    input.apply,
    plan.needsRepair
      ? `${input.apply ? 'Repaired' : 'Ready to repair'} parcel receiving workflow. Caller assignment, call history and receipt timestamp are preserved.`
      : 'No supported receiving-workflow repair is needed. Existing location and status are retained.',
  );
  if (input.apply) {
    const updated = await tx`update parcels set pickup_location_id = ${plan.after.pickupLocationId},
      status = ${plan.after.status}, updated_at = now()
      where id = ${parcel.id} and company_id = ${input.companyId}
        and not is_deleted and deleted_at is null and confirmed_at is null
        and status = ${parcel.status}
        and pickup_location_id is not distinct from ${parcel.pickup_location_id}
      returning id`;
    if (updated.length !== 1) throw Conflict('Parcel changed during repair. Run a fresh preview.');
    await writeBookingRepairAudit(
      tx,
      input,
      parcel.id,
      'PARCEL_RECEIVING_WORKFLOW_REPAIRED',
      details,
    );
  }
  return result;
}
