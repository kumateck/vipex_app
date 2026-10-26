import { Elysia } from 'elysia';
import { db, sql } from '@/db/config';
import { companies, customers, parcels, roles, rolePermissions, users } from '@/db/schemas';
import { PermissionKeys } from '@/shared/permissions/constants';
import { parcelCreditChargeRoutes } from '@/server/features/shipments/parcel-credit-charge.routes';
import { errorHandler } from '@/server/middlewares/error-handler';
import { signAccessToken } from '@/server/utils/jwt';
import {
  requestCreditChargeSvc,
  decideCreditChargeSvc,
} from '@/server/features/shipments/parcel-charge-corrections';
import { createIsolatedSchemaFixture } from './isolated-schema-fixture';

export async function createChargeApprovalFixture() {
  const schema = await createIsolatedSchemaFixture('vipex_charge_approval_test');
  // Exercise the real migration's constraints and FKs, not just fixture columns.
  await sql`drop table parcel_charge_corrections`;
  await sql
    .unsafe(await Bun.file('drizzle/0091_parcel_charge_correction_approvals.sql').text())
    .simple();
  await db.insert(companies).values(
    ['company', 'other'].map((id) => ({
      id,
      name: id,
      type: 'courier',
      code: id,
      createdBy: 'requester',
    })),
  );
  await db.insert(roles).values(
    ['requester', 'approver', 'general'].map((id) => ({
      id,
      companyId: 'company',
      name: id,
      createdBy: 'requester',
    })),
  );
  await db.insert(users).values(
    ['requester', 'approver', 'general'].map((id) => ({
      id,
      companyId: 'company',
      branchId: 'source',
      roleId: id,
      fullname: id,
      email: `${id}@example.test`,
      telephone: '0200000000',
      status: 0,
      createdBy: 'requester',
    })),
  );
  await db.insert(rolePermissions).values([
    { roleId: 'requester', companyId: 'company', permission: PermissionKeys.CanUpdateParcelCharge },
    {
      roleId: 'requester',
      companyId: 'company',
      permission: PermissionKeys.CanApproveParcelCharge,
    },
    { roleId: 'approver', companyId: 'company', permission: PermissionKeys.CanApproveParcelCharge },
    { roleId: 'general', companyId: 'company', permission: PermissionKeys.CanUpdateParcels },
    {
      roleId: 'general',
      companyId: 'company',
      permission: PermissionKeys.CanApproveParcelReconciliation,
    },
  ]);
  const app = new Elysia()
    .use(errorHandler)
    .group('/v1/shipments/parcels', (routes) => routes.use(parcelCreditChargeRoutes));
  const proposal = {
    companyId: 'company',
    parcelId: 'parcel',
    actorUserId: 'requester',
    chargeCedis: '50.00',
    expectedChargePsw: 0,
    method: 4,
    reason: 'Correct missing original charge',
  };
  return {
    async cleanup() {
      // Shared fixture drops tables in schema-export order; remove real migration FKs first.
      await sql.unsafe(`alter table parcel_charge_corrections
        drop constraint parcel_charge_corrections_company_id_fkey,
        drop constraint parcel_charge_corrections_parcel_id_fkey,
        drop constraint parcel_charge_corrections_customer_id_fkey,
        drop constraint parcel_charge_corrections_requested_by_fkey,
        drop constraint parcel_charge_corrections_reviewed_by_fkey`);
      await schema.cleanup();
    },
    proposal,
    request: (patch: Partial<typeof proposal> = {}) =>
      requestCreditChargeSvc({ ...proposal, ...patch }),
    review: (id: string, approve = true, actorUserId = 'approver') =>
      decideCreditChargeSvc({
        companyId: 'company',
        requestId: id,
        actorUserId,
        approve,
        note: approve ? 'Verified agreed charge' : 'Incorrect proposed charge',
      }),
    async http(path: string, method: string, body?: unknown, actor = 'requester') {
      const token = await signAccessToken({
        sub: actor,
        email: `${actor}@example.test`,
        companyId: 'company',
        roleId: actor,
      });
      return app.handle(
        new Request(`http://localhost/v1/shipments/parcels/${path}`, {
          method,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        }),
      );
    },
    async reset() {
      await sql`truncate parcel_charge_corrections, parcels, customers, payments, customer_credit_transactions, customer_credit_allocations, audit_logs, parcel_reconciliation_cases`;
      await sql`update users set status = 0`;
      await sql`update roles set is_deleted = false`;
      await db.insert(customers).values([
        {
          id: 'sender',
          companyId: 'company',
          fullname: 'Sender Business',
          customerType: 1,
          creditEligible: true,
          creditLimitPsw: 10000,
          createdBy: 'requester',
        },
        { id: 'receiver', companyId: 'company', fullname: 'Receiver', createdBy: 'requester' },
      ]);
      await db.insert(parcels).values({
        id: 'parcel',
        companyId: 'company',
        sourceId: 'source',
        destinationId: 'destination',
        bookingId: 'booking',
        bookingCode: 'ZERO1',
        trackingCode: 'TRACK1',
        senderId: 'sender',
        receiverId: 'receiver',
        senderNameSnapshot: 'Sender Business',
        receiverNameSnapshot: 'Receiver',
        chargePsw: 0,
        plannedToBePaidPsw: 0,
        method: 0,
        status: 5,
        parcelDetails: 'Box',
        parcelContent: 'Clothes',
      });
    },
  };
}
export type ChargeApprovalFixture = Awaited<ReturnType<typeof createChargeApprovalFixture>>;
