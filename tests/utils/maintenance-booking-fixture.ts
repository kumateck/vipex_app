import { db, sql } from '@/db/config';
import { auditLogs, customers, parcels, payments, roles, users, branches } from '@/db/schemas';
import { createIsolatedSchemaFixture } from './isolated-schema-fixture';
import { executeMaintenanceRunSvc } from '@/server/features/maintenance/service';
import type { MaintenanceScriptId } from '@/shared/maintenance';

export async function createMaintenanceBookingFixture() {
  const schema = await createIsolatedSchemaFixture('vipex_maintenance_booking_test');
  // Migration 0073 permits NULL snapshots on legacy parcels; model that real repair state.
  await sql.unsafe(
    'alter table parcels alter column sender_name_snapshot drop not null, alter column receiver_name_snapshot drop not null, alter column second_receiver_name_snapshot drop not null',
  );
  await db
    .insert(roles)
    .values({ id: 'admin-role', companyId: 'company', name: 'System Admin', createdBy: 'admin' });
  await db.insert(users).values({
    id: 'admin',
    companyId: 'company',
    branchId: 'source',
    roleId: 'admin-role',
    fullname: 'Administrator',
    email: 'admin@example.test',
    telephone: '0200000000',
    createdBy: 'admin',
    status: 0,
  });
  await db.insert(branches).values(
    ['source', 'destination'].map((id) => ({
      id,
      companyId: 'company',
      name: id,
      createdBy: 'admin',
    })),
  );
  const admin = {
    sub: 'admin',
    companyId: 'company',
    roleId: 'admin-role',
    email: 'admin@example.test',
  };
  return {
    cleanup: schema.cleanup,
    admin,
    preview: (operationId: MaintenanceScriptId, bookingCode = 'BOOK1') =>
      executeMaintenanceRunSvc(admin, { operationId, params: { bookingCode }, mode: 'preview' }),
    apply: (operationId: MaintenanceScriptId, previewRunId: string, bookingCode = 'BOOK1') =>
      executeMaintenanceRunSvc(admin, {
        operationId,
        params: { bookingCode },
        mode: 'execute',
        previewRunId,
        confirmRepair: true,
      }),
    async reset() {
      await sql`truncate parcels, payments, customers, deliveries, audit_logs, tax_journal_items, tax_filing_audit_logs, journal_entries, daily_cash_confirmations, customer_credit_transactions, customer_credit_allocations`;
      await db.insert(customers).values(
        ['sender', 'receiver', 'second'].map((id) => ({
          id,
          companyId: 'company',
          fullname: `Name ${id}`,
          createdBy: 'admin',
        })),
      );
      await db.insert(parcels).values({
        id: 'parcel',
        companyId: 'company',
        sourceId: 'source',
        destinationId: 'destination',
        bookingId: 'booking',
        bookingCode: 'BOOK1',
        trackingCode: 'TRACK1',
        senderId: 'sender',
        receiverId: 'receiver',
        chargePsw: 5000,
        plannedToBePaidPsw: 0,
        method: 0,
        status: 5,
        parcelDetails: 'Box',
        parcelContent: 'Clothes',
      });
      await sql`update parcels set sender_name_snapshot = null, receiver_name_snapshot = null`;
    },
    async payment(id: string, payer = 0, amountPsw = 2000, component = 0) {
      await db.insert(payments).values({
        id,
        companyId: 'company',
        branchId: 'source',
        parcelId: 'parcel',
        cashierUserId: 'admin',
        component,
        payer,
        cashierType: payer,
        method: 0,
        grossAmountPsw: amountPsw,
        netAmountPsw: amountPsw,
        vatPsw: 0,
        getfundPsw: 0,
        nhilPsw: 0,
        covidPsw: 0,
        taxTotalPsw: 0,
        receivedAt: new Date('2026-10-20T10:00:00Z'),
      });
    },
    async reversal() {
      await db.insert(auditLogs).values({
        companyId: 'company',
        actorUserId: 'admin',
        entityType: 'parcel',
        entityId: 'parcel',
        action: 'PARCEL_DELIVERY_REVERSED',
        createdAt: new Date('2026-10-20T12:00:00Z'),
      });
    },
  };
}
export type MaintenanceBookingFixture = Awaited<ReturnType<typeof createMaintenanceBookingFixture>>;
