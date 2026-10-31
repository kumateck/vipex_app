import type { TaggedTransaction } from '../credit-repair';
import { getBookingParcel, type BookingOperation } from '../booking-operations';
import type { WorkflowEvidence, WorkflowParcel } from './types';

const nullableString = (value: unknown) => (value == null ? null : String(value));
const timestamp = (value: unknown) =>
  value == null ? null : value instanceof Date ? value : String(value);

export async function loadWorkflowParcel(
  tx: TaggedTransaction,
  input: BookingOperation,
): Promise<WorkflowParcel> {
  const row = await getBookingParcel(tx, input);
  return {
    id: String(row.id),
    booking_code: String(row.booking_code),
    destination_id: String(row.destination_id),
    pickup_location_id: nullableString(row.pickup_location_id),
    status: Number(row.status),
    received_at: timestamp(row.received_at),
    confirmed_at: timestamp(row.confirmed_at),
    deleted_at: timestamp(row.deleted_at),
    call_center_assigned_to_user_id: nullableString(row.call_center_assigned_to_user_id),
    call_center_called_at: timestamp(row.call_center_called_at),
    updated_at: timestamp(row.updated_at)!,
  };
}

export async function loadWorkflowEvidence(
  tx: TaggedTransaction,
  input: BookingOperation,
  parcel: WorkflowParcel,
): Promise<WorkflowEvidence> {
  const locations = await tx`select id, name from locations
    where company_id = ${input.companyId} and branch_id = ${parcel.destination_id}
      and not is_deleted and can_receive order by id`;
  const [latestStatusChange] = await tx`select id, created_at,
      metadata::jsonb->'previous'->>'status' as previous_status,
      metadata::jsonb->'patch'->>'status' as next_status
    from audit_logs where company_id = ${input.companyId}
      and entity_type = 'parcel' and entity_id = ${parcel.id} and action = 'PARCEL_UPDATED'
      and metadata::jsonb->'patch' ? 'status'
    order by created_at desc, id desc limit 1`;
  const deliveries =
    await tx`select id, mode, status, delivered_at, confirmed_at, rider_completed_at
    from deliveries where parcel_id = ${parcel.id} and not is_deleted order by id`;
  return {
    locations: locations.map((row) => ({ id: String(row.id), name: String(row.name) })),
    latestStatusChange: latestStatusChange
      ? {
          id: String(latestStatusChange.id),
          created_at: timestamp(latestStatusChange.created_at)!,
          previous_status: nullableString(latestStatusChange.previous_status),
          next_status: nullableString(latestStatusChange.next_status),
        }
      : null,
    deliveries: deliveries.map((row) => ({
      id: String(row.id),
      mode: Number(row.mode),
      status: String(row.status),
      delivered_at: timestamp(row.delivered_at),
      confirmed_at: timestamp(row.confirmed_at),
      rider_completed_at: timestamp(row.rider_completed_at),
    })),
  };
}
