import { bookingInspectionExecutor } from './executor';
import { listParcelsRepo } from '@/server/features/shipments/parcels.repository';
import type { TaggedTransaction } from '../credit-repair';
import { getBookingParcel, type BookingOperation } from './context';

export async function checkBookingSearch(tx: TaggedTransaction, input: BookingOperation) {
  const parcel = await getBookingParcel(tx, input);
  const reports = [];
  const executor = bookingInspectionExecutor(tx);
  for (const side of ['sourceId', 'destinationId'] as const) {
    const started = performance.now();
    const result = await listParcelsRepo(
      {
        companyId: input.companyId,
        [side]: String(side === 'sourceId' ? parcel.source_id : parcel.destination_id),
        search: String(parcel.booking_code),
        limit: 50,
        offset: 0,
        includeDeleted: false,
      },
      executor,
    );
    reports.push({
      side,
      total: result.totalRecords,
      returned: result.data.length,
      targetFound: result.data.some((row) => row.id === parcel.id),
      elapsedMs: Math.round(performance.now() - started),
    });
  }
  return {
    summary: 'Checked booking search from the source and destination branches.',
    details: { bookingCode: parcel.booking_code, parcelId: parcel.id, reports },
    readyToApply: false,
  };
}
export async function inspectClearedDeliveryFee(tx: TaggedTransaction, input: BookingOperation) {
  const parcel = await getBookingParcel(tx, input);
  const deliveries =
    await tx`select d.id, d.status, d.mode, d.charge_psw, d.returned_at, d.updated_at,
    d.change_request_status, d.requested_charge_psw, d.rider_collected_delivery_fee_psw
    from deliveries d join parcels p on p.id = d.parcel_id
    where p.company_id = ${input.companyId} and d.parcel_id = ${parcel.id}
      and not d.is_deleted order by d.id limit 20`;
  const payments = await tx`select id, gross_amount_psw, method, payer, received_at, voided_at
    from payments where company_id = ${input.companyId} and parcel_id = ${parcel.id}
      and component = 1 order by id limit 100`;
  const audit =
    await tx`select id, entity_type, entity_id, action, created_at, metadata from audit_logs
    where company_id = ${input.companyId} and (entity_id = ${parcel.id} or entity_id in
      (select d.id from deliveries d join parcels p on p.id = d.parcel_id where p.company_id = ${input.companyId} and d.parcel_id = ${parcel.id}))
    and entity_type in ('parcel', 'delivery') order by created_at desc, id desc limit 50`;
  const candidates = deliveries.filter(
    (row) => Number(row.charge_psw) === 0 && row.returned_at && row.mode === 1,
  );
  return {
    summary: candidates.length
      ? `Found ${candidates.length} cleared delivery fee candidate(s). Review the recorded fee and return evidence.`
      : 'No cleared returned-delivery fee was found for this parcel.',
    details: {
      parcelId: parcel.id,
      bookingCode: parcel.booking_code,
      status: parcel.status,
      deliveries,
      payments,
      audit,
    },
    readyToApply: false,
  };
}
