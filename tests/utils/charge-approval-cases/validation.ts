import { expect, test } from 'bun:test';
import { db, sql } from '@/db/config';
import { customerCreditTransactions, payments } from '@/db/schemas';
import { decideCreditChargeSvc } from '@/server/features/shipments/parcel-charge-corrections';
import type { ChargeApprovalFixture } from '../charge-approval-fixture';

export function registerChargeValidationCases(current: () => ChargeApprovalFixture) {
  test('only zero charge, explicit CREDIT and positive exact amounts are accepted', async () => {
    const f = current();
    for (const chargeCedis of ['0', '-1', '0.001', '50.001', '100001', 'Infinity'])
      await expect(f.request({ chargeCedis })).rejects.toMatchObject({ status: 400 });
    await expect(f.request({ method: 0 })).rejects.toMatchObject({ status: 400 });
    await expect(f.request({ expectedChargePsw: 5000 })).rejects.toMatchObject({ status: 400 });
    for (const method of [0, 4]) {
      await sql`update parcels set charge_psw = 5000, method = ${method}`;
      await expect(f.request()).rejects.toMatchObject({ status: 409 });
    }
  });
  test('zero-charge CREDIT parcels without a posted charge can also be corrected', async () => {
    const f = current();
    await sql`update parcels set method = 4`;
    const proposal = await f.request();
    await f.review(proposal.id);
    expect(await db.select().from(customerCreditTransactions)).toHaveLength(1);
  });
  test('credit approval and available limit are checked again at approval time', async () => {
    const f = current();
    const proposal = await f.request();
    await sql`update customers set credit_eligible = false where id = 'sender'`;
    await expect(f.review(proposal.id)).rejects.toMatchObject({ status: 409 });
    await sql`update customers set credit_eligible = true, credit_limit_psw = 1000 where id = 'sender'`;
    await expect(f.review(proposal.id)).rejects.toMatchObject({ status: 409 });
    expect(await db.select().from(customerCreditTransactions)).toHaveLength(0);
  });
  test('changed method, charge and delivered status block approval', async () => {
    const f = current();
    const proposal = await f.request();
    await sql`update parcels set method = 4`;
    await expect(f.review(proposal.id)).rejects.toMatchObject({ status: 409 });
    await sql`update parcels set method = 0, charge_psw = 100`;
    await expect(f.review(proposal.id)).rejects.toMatchObject({ status: 409 });
    await sql`update parcels set charge_psw = 0, status = 6`;
    await expect(f.review(proposal.id)).rejects.toMatchObject({ status: 409 });
  });
  test('new payments or existing credit entries block approval', async () => {
    const f = current();
    const proposal = await f.request();
    await db.insert(payments).values({
      id: 'payment',
      companyId: 'company',
      branchId: 'source',
      parcelId: 'parcel',
      cashierUserId: 'requester',
      component: 0,
      payer: 0,
      cashierType: 0,
      method: 0,
      grossAmountPsw: 100,
      netAmountPsw: 100,
      vatPsw: 0,
      getfundPsw: 0,
      nhilPsw: 0,
      covidPsw: 0,
      taxTotalPsw: 0,
    });
    await expect(f.review(proposal.id)).rejects.toMatchObject({ status: 409 });
    await sql`truncate payments`;
    await db.insert(customerCreditTransactions).values({
      companyId: 'company',
      customerId: 'sender',
      referenceId: 'parcel',
      sourceType: 0,
      transactionType: 0,
      signedAmountPsw: 5000,
      createdBy: 'requester',
    });
    await expect(f.review(proposal.id)).rejects.toMatchObject({ status: 409 });
  });
  test('foreign parcels/requests and inactive or generally privileged staff are denied', async () => {
    const f = current();
    await expect(f.request({ companyId: 'other' })).rejects.toMatchObject({ status: 403 });
    await expect(f.request({ actorUserId: 'general' })).rejects.toMatchObject({ status: 403 });
    const proposal = await f.request();
    await expect(f.review(proposal.id, true, 'general')).rejects.toMatchObject({ status: 403 });
    await expect(
      decideCreditChargeSvc({
        companyId: 'company',
        requestId: 'foreign',
        actorUserId: 'approver',
        approve: true,
      }),
    ).rejects.toMatchObject({ status: 404 });
    await sql`update users set status = 3 where id = 'approver'`;
    await expect(f.review(proposal.id)).rejects.toMatchObject({ status: 403 });
    await sql`update users set status = 0`;
    await sql`update roles set is_deleted = true where id = 'approver'`;
    await expect(f.review(proposal.id)).rejects.toMatchObject({ status: 403 });
  });
  test('HTTP route requires dedicated permissions and proposal returns 202 without applying', async () => {
    const f = current();
    const body = {
      chargeCedis: 50,
      expectedChargePsw: 0,
      method: 4,
      reason: 'Correct original zero charge',
    };
    expect((await f.http('parcel/credit-charge', 'PATCH', body, 'general')).status).toBe(403);
    expect(
      (await f.http('parcel/credit-charge', 'PATCH', { ...body, expectedChargePsw: 50 })).status,
    ).toBe(400);
    const response = await f.http('parcel/credit-charge', 'PATCH', body);
    expect(response.status).toBe(202);
    const proposal = await response.json();
    expect(
      (
        await f.http(
          `charge-corrections/${proposal.id}/review`,
          'POST',
          { approve: true },
          'general',
        )
      ).status,
    ).toBe(403);
    const list = await f.http('charge-corrections', 'GET', undefined, 'approver');
    expect(list.status).toBe(200);
    expect((await list.json()).data[0]).toMatchObject({
      requestedByName: 'requester',
      customerName: 'Sender Business',
    });
    expect(
      (
        await f.http(
          `charge-corrections/${proposal.id}/review`,
          'POST',
          { approve: true },
          'approver',
        )
      ).status,
    ).toBe(200);
  });
  test('live permission revocation denies review and foreign request IDs remain hidden', async () => {
    const f = current();
    const proposal = await f.request();
    await sql`update role_permissions set permission = 'revoked-test' where role_id = 'approver' and permission = 'CanApproveParcelCharge'`;
    try {
      await expect(f.review(proposal.id)).rejects.toMatchObject({ status: 403 });
    } finally {
      await sql`update role_permissions set permission = 'CanApproveParcelCharge' where role_id = 'approver' and permission = 'revoked-test'`;
    }
    await sql`update parcel_charge_corrections set company_id = 'other' where id = ${proposal.id}`;
    await expect(f.review(proposal.id)).rejects.toMatchObject({ status: 404 });
    const list = await f.http('charge-corrections', 'GET', undefined, 'approver');
    expect((await list.json()).data).toEqual([]);
  });
  test('real database constraints reject invalid review attribution and nonpositive charges', async () => {
    const f = current();
    const proposal = await f.request();
    const invalidCharge = async () => {
      await sql`update parcel_charge_corrections set charge_psw = 0 where id = ${proposal.id}`;
    };
    const missingReviewer = async () => {
      await sql`update parcel_charge_corrections set status = 1 where id = ${proposal.id}`;
    };
    const selfReview = async () => {
      await sql`update parcel_charge_corrections set status = 1, reviewed_by = 'requester', reviewed_at = now() where id = ${proposal.id}`;
    };
    await expect(invalidCharge()).rejects.toMatchObject({ code: '23514' });
    await expect(missingReviewer()).rejects.toMatchObject({ code: '23514' });
    await expect(selfReview()).rejects.toMatchObject({ code: '23514' });
  });
}
