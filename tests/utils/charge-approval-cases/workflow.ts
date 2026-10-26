import { getParcelHistorySvc } from '@/server/features/shipments/parcel-history/parcel-history.service';
import { expect, test } from 'bun:test';
import { db, sql } from '@/db/config';
import {
  auditLogs,
  customerCreditTransactions,
  parcelChargeCorrections,
  parcels,
  payments,
} from '@/db/schemas';
import { listCustomerTransactionsSvc } from '@/server/features/customers/service';
import { postCustomerCreditPaymentSvc } from '@/server/features/customers/credit-settlement';
import { getStickerPaymentRecord } from '@/server/features/shipments/parcel-sticker-payment.repository';
import type { ChargeApprovalFixture } from '../charge-approval-fixture';

export function registerChargeWorkflowCases(current: () => ChargeApprovalFixture) {
  test('proposal changes nothing; independent approval atomically creates CREDIT debt and audit', async () => {
    const f = current();
    const proposal = await f.request();
    expect(proposal.status).toBe('PENDING_APPROVAL');
    expect((await sql`select charge_psw, method from parcels`)[0]).toMatchObject({
      charge_psw: '0',
      method: 0,
    });
    expect(await db.select().from(customerCreditTransactions)).toHaveLength(0);
    await f.review(proposal.id);
    expect(
      (await sql`select charge_psw, method, planned_tobepaid_psw from parcels`)[0],
    ).toMatchObject({ charge_psw: '5000', method: 4, planned_tobepaid_psw: '0' });
    expect((await db.select().from(customerCreditTransactions))[0]).toMatchObject({
      customerId: 'sender',
      signedAmountPsw: 5000,
      transactionType: 0,
      sourceType: 0,
      createdBy: 'approver',
    });
    expect((await db.select().from(parcelChargeCorrections))[0]).toMatchObject({
      status: 1,
      requestedBy: 'requester',
      reviewedBy: 'approver',
    });
    expect((await db.select().from(auditLogs)).map((row) => row.action)).toContain(
      'PARCEL_ZERO_CHARGE_CORRECTION_APPROVED',
    );
    expect(await getStickerPaymentRecord('company', 'TRACK1', 'ZERO1')).toMatchObject({
      chargePsw: 5000,
      creditPsw: 5000,
      method: 4,
    });
  });
  test('requester cannot self-approve even with both permissions', async () => {
    const f = current();
    const proposal = await f.request();
    await expect(f.review(proposal.id, true, 'requester')).rejects.toMatchObject({ status: 409 });
    expect((await db.select().from(parcelChargeCorrections))[0]!.status).toBe(0);
  });
  test('rejecting leaves the parcel unchanged and allows a corrected proposal', async () => {
    const f = current();
    const proposal = await f.request();
    await f.review(proposal.id, false);
    expect((await sql`select charge_psw, method from parcels`)[0]).toMatchObject({
      charge_psw: '0',
      method: 0,
    });
    expect(await db.select().from(customerCreditTransactions)).toHaveLength(0);
    expect((await f.request({ chargeCedis: '40' })).id).not.toBe(proposal.id);
  });
  test('duplicate requests and concurrent approvals cannot duplicate customer debt', async () => {
    const f = current();
    const requests = await Promise.allSettled([f.request(), f.request()]);
    expect(requests.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const pending = (await db.select().from(parcelChargeCorrections))[0]!;
    const reviews = await Promise.allSettled([f.review(pending.id), f.review(pending.id)]);
    expect(reviews.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await db.select().from(customerCreditTransactions)).toHaveLength(1);
    await expect(f.review(pending.id)).rejects.toMatchObject({ status: 409 });
  });
  test('audit failure rolls approval, ledger and parcel back together', async () => {
    const f = current();
    const proposal = await f.request();
    await sql.unsafe(
      `create function reject_charge_audit() returns trigger language plpgsql as $$ begin if NEW.action = 'PARCEL_ZERO_CHARGE_CORRECTION_APPROVED' then raise exception 'audit unavailable'; end if; return NEW; end $$`,
    );
    await sql.unsafe(
      'create trigger reject_charge_audit before insert on audit_logs for each row execute function reject_charge_audit()',
    );
    try {
      await expect(f.review(proposal.id)).rejects.toBeDefined();
    } finally {
      await sql.unsafe('drop trigger reject_charge_audit on audit_logs');
      await sql.unsafe('drop function reject_charge_audit()');
    }
    expect((await db.select().from(parcelChargeCorrections))[0]!.status).toBe(0);
    expect(await db.select().from(customerCreditTransactions)).toHaveLength(0);
    expect(Number((await sql`select charge_psw from parcels`)[0]!.charge_psw)).toBe(0);
  });
  test('approved credit charge displays Credit and full debt settlement displays Paid', async () => {
    const f = current();
    const proposal = await f.request();
    await f.review(proposal.id);
    const transactions = () =>
      listCustomerTransactionsSvc({
        customerId: 'sender',
        companyId: 'company',
        limit: 20,
        offset: 0,
      });
    expect((await transactions()).data[0]!.paymentStatus).toBe('CREDIT');
    await postCustomerCreditPaymentSvc({
      companyId: 'company',
      customerId: 'sender',
      createdBy: 'approver',
      parcelIds: ['parcel'],
      amountCedis: 50,
    });
    expect((await transactions()).data[0]!.paymentStatus).toBe('PAID');
  });
  test('approval works with the installed customer snapshot trigger', async () => {
    const f = current();
    const proposal = await f.request();
    const source = await Bun.file('drizzle/0081_parcel_receiver_name_corrections.sql').text();
    const start = source.indexOf('CREATE OR REPLACE FUNCTION');
    await sql.unsafe(source.slice(start, source.indexOf('$$;', start) + 3));
    await sql.unsafe(
      'create trigger test_correction_names before update on parcels for each row execute function set_parcel_customer_name_snapshots()',
    );
    try {
      await f.review(proposal.id);
    } finally {
      await sql.unsafe('drop trigger test_correction_names on parcels');
      await sql.unsafe('drop function set_parcel_customer_name_snapshots()');
    }
    expect(Number((await sql`select charge_psw from parcels`)[0]!.charge_psw)).toBe(5000);
  });
  test('transaction labels use active principal totals correlated to each parcel', async () => {
    await sql`update parcels set charge_psw = 5000`;
    const read = () =>
      listCustomerTransactionsSvc({
        customerId: 'sender',
        companyId: 'company',
        limit: 20,
        offset: 0,
      });
    expect((await read()).data[0]!.paymentStatus).toBe('TO_BE_PAID');
    await db.insert(payments).values({
      id: 'cash',
      companyId: 'company',
      branchId: 'source',
      parcelId: 'parcel',
      cashierUserId: 'requester',
      component: 0,
      payer: 0,
      cashierType: 0,
      method: 0,
      grossAmountPsw: 2000,
      netAmountPsw: 2000,
      vatPsw: 0,
      getfundPsw: 0,
      nhilPsw: 0,
      covidPsw: 0,
      taxTotalPsw: 0,
    });
    expect((await read()).data[0]!.paymentStatus).toBe('PARTIAL');
    await sql`update payments set gross_amount_psw = 5000`;
    expect((await read()).data[0]!.paymentStatus).toBe('PAID');
    await db.insert(parcels).values({
      id: 'unpaid',
      companyId: 'company',
      sourceId: 'source',
      destinationId: 'destination',
      bookingId: 'booking',
      bookingCode: 'UNPAID2',
      trackingCode: 'TRACK2',
      senderId: 'sender',
      receiverId: 'receiver',
      chargePsw: 5000,
      method: 0,
      parcelDetails: 'Box',
      parcelContent: 'Clothes',
    });
    expect((await read()).data.find((row) => row.id === 'unpaid')!.paymentStatus).toBe(
      'TO_BE_PAID',
    );
    await sql`update payments set voided_at = now()`;
    expect((await read()).data.find((row) => row.id === 'parcel')!.paymentStatus).toBe(
      'TO_BE_PAID',
    );
  });
  test('Parcel Details history keeps the reason and staff attribution after approval', async () => {
    const f = current();
    const proposal = await f.request();
    await f.review(proposal.id);
    const history = await getParcelHistorySvc('parcel', { companyId: 'company' });
    const requested = history.events.find((event) => event.title === 'Charge correction requested');
    const approved = history.events.find(
      (event) => event.title === 'Charge correction approved and applied',
    );
    expect(requested).toMatchObject({ actorName: 'requester' });
    expect(requested!.description).toContain('Correct missing original charge');
    expect(approved).toMatchObject({ actorName: 'approver' });
    for (const value of [
      'GHS 0.00 → GHS 50.00',
      'Cash → CREDIT',
      'Correct missing original charge',
      'Verified agreed charge',
      'Requested by: requester',
    ])
      expect(approved!.description).toContain(value);
  });
}
