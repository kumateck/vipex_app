import { sql } from '@/db/config';
import { executeMaintenanceRunSvc } from '@/server/features/maintenance/service';
import type { MaintenanceBookingFixture } from '../maintenance-booking-fixture';

export const operationId = 'repair-parcel-receiving-workflow';
export async function prepareReceivingCase(called = false) {
  await sql`insert into locations (id,company_id,branch_id,name,created_by)
    values ('circle','company','destination','Circle','admin')`;
  await sql`update parcels set status = 3,
    pickup_location_id = ${called ? 'circle' : null},
    call_center_assigned_to_user_id = ${called ? 'admin' : null},
    call_center_called_at = ${called ? '2026-10-21 07:17:34' : null}::timestamp`;
  await sql`insert into audit_logs (id,company_id,actor_user_id,entity_type,entity_id,action,metadata,created_at)
    values ('arrival','company','admin','parcel','parcel','PARCEL_UPDATED',
      ${JSON.stringify({ patch: { status: 3 }, previous: { status: called ? 5 : 2 } })}::json,
      '2026-10-21 08:14:24')`;
}
export function previewReceiving(f: MaintenanceBookingFixture, pickupLocationId?: string) {
  return executeMaintenanceRunSvc(f.admin, {
    operationId,
    params: { bookingCode: 'BOOK1', ...(pickupLocationId ? { pickupLocationId } : {}) },
    mode: 'preview',
  });
}
export function applyReceiving(
  f: MaintenanceBookingFixture,
  previewRunId: string,
  pickupLocationId?: string,
) {
  return executeMaintenanceRunSvc(f.admin, {
    operationId,
    params: { bookingCode: 'BOOK1', ...(pickupLocationId ? { pickupLocationId } : {}) },
    mode: 'execute',
    previewRunId,
    confirmRepair: true,
  });
}
