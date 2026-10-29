import { Conflict } from '@/server/utils/http-error';
import type { TaggedTransaction } from '../credit-repair';
import {
  bookingRepairResult,
  getBookingParcel,
  writeBookingRepairAudit,
  type BookingOperation,
} from './context';

export async function backfillBookingNames(tx: TaggedTransaction, input: BookingOperation) {
  const parcel = await getBookingParcel(tx, input);
  const ids = [parcel.sender_id, parcel.receiver_id, parcel.second_receiver_id]
    .filter(Boolean)
    .map(String);
  const customers = await tx.unsafe(
    `select id, fullname from customers
    where company_id = $1 and id = any($2::text[]) order by id${input.apply ? ' for share' : ''}`,
    [input.companyId, ids],
  );
  const names = new Map(customers.map((row) => [String(row.id), String(row.fullname ?? '')]));
  const before = {
    sender: parcel.sender_name_snapshot,
    receiver: parcel.receiver_name_snapshot,
    secondReceiver: parcel.second_receiver_name_snapshot,
  };
  const snapshot = (value: string | null | undefined, customerId: unknown) =>
    value ?? names.get(String(customerId));
  const after = {
    sender: snapshot(before.sender, parcel.sender_id),
    receiver: snapshot(before.receiver, parcel.receiver_id),
    secondReceiver: !parcel.second_receiver_id
      ? null
      : snapshot(before.secondReceiver, parcel.second_receiver_id),
  };
  const usable = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
  const missing =
    !usable(after.sender) ||
    !usable(after.receiver) ||
    (parcel.second_receiver_id && !usable(after.secondReceiver));
  const details = {
    parcelId: parcel.id,
    bookingCode: parcel.booking_code,
    before,
    after,
    customers,
  };
  const needsRepair =
    before.sender !== after.sender ||
    before.receiver !== after.receiver ||
    before.secondReceiver !== after.secondReceiver;
  const result = bookingRepairResult(
    details,
    missing
      ? 'A required customer name is missing or belongs to another company. Correct the customer record first.'
      : null,
    needsRepair,
    input.apply,
    needsRepair
      ? `${input.apply ? 'Backfilled' : 'Ready to backfill'} missing parcel customer names. Existing snapshots are preserved.`
      : 'Parcel customer-name snapshots are already complete.',
  );
  if (input.apply) {
    const updated =
      await tx`update parcels set sender_name_snapshot = ${after.sender ?? null}, receiver_name_snapshot = ${after.receiver ?? null},
      second_receiver_name_snapshot = ${after.secondReceiver ?? null}, updated_at = now()
      where id = ${parcel.id} and company_id = ${input.companyId}
      returning sender_name_snapshot, receiver_name_snapshot, second_receiver_name_snapshot`;
    if (
      updated.length !== 1 ||
      updated[0]!.sender_name_snapshot !== after.sender ||
      updated[0]!.receiver_name_snapshot !== after.receiver ||
      updated[0]!.second_receiver_name_snapshot !== after.secondReceiver
    )
      throw Conflict('Parcel name snapshots changed during repair. Run a new preview.');
    await writeBookingRepairAudit(
      tx,
      input,
      String(parcel.id),
      'PARCEL_CUSTOMER_NAMES_BACKFILLED',
      details,
    );
  }
  return result;
}
