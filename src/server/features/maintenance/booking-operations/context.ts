import { createId } from '@paralleldrive/cuid2';
import { Conflict, NotFound } from '@/server/utils/http-error';
import type { MaintenanceResult } from '@/shared/maintenance';
import type { TaggedTransaction } from '../credit-repair';

export type BookingOperation = { companyId: string; actorId: string; code: string; apply: boolean };
export async function getBookingParcel(tx: TaggedTransaction, input: BookingOperation) {
  const query = `select * from parcels where company_id = $1 and not is_deleted
    and (lower(booking_code) = lower($2) or lower(tracking_code) = lower($2))
    order by id limit 2${input.apply ? ' for update' : ''}`;
  const rows = await tx.unsafe(query, [input.companyId, input.code]);
  if (!rows.length) throw NotFound('No active parcel found for this booking or tracking code');
  if (rows.length !== 1) throw Conflict('Multiple parcels match. Enter the unique tracking code.');
  return rows[0]!;
}
export async function getParcelPayments(
  tx: TaggedTransaction,
  input: BookingOperation,
  parcelId: string,
) {
  return tx.unsafe(
    `select * from payments where company_id = $1 and parcel_id = $2
    order by id${input.apply ? ' for update' : ''}`,
    [input.companyId, parcelId],
  );
}
export async function writeBookingRepairAudit(
  tx: TaggedTransaction,
  input: BookingOperation,
  parcelId: string,
  action: string,
  metadata: Record<string, unknown>,
) {
  await tx`insert into audit_logs (id, company_id, actor_user_id, entity_type, entity_id, action, message, metadata)
    values (${createId()}, ${input.companyId}, ${input.actorId}, 'parcel', ${parcelId}, ${action},
      ${`System Admin repair for ${input.code}`}, ${tx.typed(JSON.stringify(metadata), 25)}::json)`;
}
export function bookingRepairResult(
  details: Record<string, unknown>,
  restriction: string | null,
  needsRepair: boolean,
  apply: boolean,
  summary: string,
): MaintenanceResult {
  if (apply && (restriction || !needsRepair))
    throw Conflict(restriction ?? 'Records are already correct. Run a new inspection.');
  return {
    details: { ...details, restriction },
    summary: restriction ?? summary,
    readyToApply: !apply && !restriction && needsRepair,
  };
}
export const money = (psw: number) => `GHS ${(psw / 100).toFixed(2)}`;
