import { expect, test } from 'bun:test';
import { sql } from '@/db/config';
import type { MaintenanceBookingFixture } from '../maintenance-booking-fixture';
import { executeMaintenanceRunSvc } from '@/server/features/maintenance/service';

export function registerBalanceCases(fixture: () => MaintenanceBookingFixture) {
  test('financial balance preview is read-only and apply retains payments', async () => {
    const f = fixture();
    await f.payment('sender-pay');
    const preview = await f.preview('repair-parcel-financial-state');
    expect(preview.result).toMatchObject({
      readyToApply: true,
      details: { previousPsw: 0, restoredPsw: 3000 },
    });
    expect((await sql`select planned_tobepaid_psw from parcels`)[0]!.planned_tobepaid_psw).toBe(
      '0',
    );
    await f.apply('repair-parcel-financial-state', preview.id);
    expect(
      Number((await sql`select planned_tobepaid_psw from parcels`)[0]!.planned_tobepaid_psw),
    ).toBe(3000);
    expect((await sql`select voided_at from payments`)[0]!.voided_at).toBeNull();
    expect((await f.preview('repair-parcel-financial-state')).result!.readyToApply).toBe(false);
    await expect(f.apply('repair-parcel-financial-state', preview.id)).rejects.toMatchObject({
      status: 409,
    });
  });
  test('reversal restoration supports any booking and requires reversal evidence', async () => {
    const f = fixture();
    await f.payment('sender-pay');
    expect((await f.preview('restore-reversed-parcel-balance')).result!.readyToApply).toBe(false);
    await f.reversal();
    const preview = await f.preview('restore-reversed-parcel-balance');
    expect(preview.result!.readyToApply).toBe(true);
    await f.apply('restore-reversed-parcel-balance', preview.id);
    expect(
      Number((await sql`select planned_tobepaid_psw from parcels`)[0]!.planned_tobepaid_psw),
    ).toBe(3000);
  });
  test('credit, delivered, cancelled and overpaid parcels are blocked', async () => {
    const f = fixture();
    for (const status of [6, 11, 14, 17, 18, 19]) {
      await sql`update parcels set status = ${status}`;
      expect((await f.preview('repair-parcel-financial-state')).result!.readyToApply).toBe(false);
    }
    await sql`update parcels set status = 5, method = 4`;
    expect((await f.preview('repair-parcel-financial-state')).result!.readyToApply).toBe(false);
    await sql`update parcels set method = 0`;
    await f.payment('excess', 0, 6000);
    expect((await f.preview('repair-parcel-financial-state')).result!.readyToApply).toBe(false);
  });
  test('confirmation is operation-specific and changed payment proof invalidates preview', async () => {
    const f = fixture();
    const preview = await f.preview('repair-parcel-financial-state');
    await expect(
      executeMaintenanceRunSvc(f.admin, {
        operationId: 'repair-parcel-financial-state',
        mode: 'execute',
        params: { bookingCode: 'BOOK1' },
        previewRunId: preview.id,
        confirmNoCashReceived: true,
      }),
    ).rejects.toMatchObject({ status: 400 });
    await f.payment('new-payment');
    await expect(f.apply('repair-parcel-financial-state', preview.id)).rejects.toMatchObject({
      status: 409,
    });
    expect(
      Number((await sql`select planned_tobepaid_psw from parcels`)[0]!.planned_tobepaid_psw),
    ).toBe(0);
  });
  test('missing, ambiguous and foreign booking codes cannot be repaired', async () => {
    const f = fixture();
    await expect(f.preview('repair-parcel-financial-state', 'MISSING')).rejects.toMatchObject({
      status: 404,
    });
    await sql`update parcels set company_id = 'other'`;
    await expect(f.preview('repair-parcel-financial-state')).rejects.toMatchObject({ status: 404 });
    await sql`update parcels set company_id = 'company'`;
    await sql.unsafe(
      `insert into parcels (id,company_id,source_id,destination_id,booking_id,booking_code,tracking_code,sender_id,receiver_id,charge_psw,parcel_details,parcel_content) select 'duplicate',company_id,source_id,destination_id,booking_id,booking_code,'TRACK2',sender_id,receiver_id,charge_psw,parcel_details,parcel_content from parcels limit 1`,
    );
    await expect(f.preview('repair-parcel-financial-state')).rejects.toMatchObject({ status: 409 });
    expect((await f.preview('repair-parcel-financial-state', 'track1')).result!.readyToApply).toBe(
      true,
    );
  });
}
