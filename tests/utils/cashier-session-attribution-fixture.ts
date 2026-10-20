import { eq } from 'drizzle-orm';
import { db, sql } from '@/db/config';
import {
  bookings,
  branches,
  cashierSessions,
  customers,
  locations,
  parcels,
  users,
  rolePermissions,
  cashierSessionDelegates,
  selfServiceBookingDrafts,
} from '@/db/schemas';
import { CashierType, ParcelStatus, PaymentMethod, UserStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createIsolatedSchemaFixture } from './isolated-schema-fixture';

export const REPORT_DATE = '2026-10-20';
export async function createCashierSessionAttributionFixture() {
  const schema = await createIsolatedSchemaFixture('vipex_cashier_attribution_test');
  await sql.unsafe(await Bun.file('drizzle/0088_parcel_cashier_session_index.sql').text());
  await db.insert(branches).values([
    { id: 'source', companyId: 'company', name: 'Source', createdBy: 'agent' },
    { id: 'destination', companyId: 'company', name: 'Destination', createdBy: 'agent' },
  ]);
  await db.insert(locations).values({
    id: 'location',
    companyId: 'company',
    branchId: 'source',
    name: 'Shared location',
    createdBy: 'agent',
  });
  await db.insert(users).values(
    ['cashier-a', 'cashier-b', 'agent'].map((id) => ({
      id,
      fullname: id,
      email: `${id}@example.test`,
      telephone: '0240000000',
      companyId: 'company',
      branchId: 'source',
      locationId: 'location',
      roleId: 'role',
      status: UserStatus.ACTIVE,
      cashierType: id === 'agent' ? null : CashierType.SENDING,
      createdBy: 'agent',
    })),
  );
  await db.insert(customers).values(
    ['sender', 'receiver'].map((id) => ({
      id,
      companyId: 'company',
      fullname: id,
      telephone: id === 'sender' ? '0240000001' : '0240000002',
      createdBy: 'agent',
    })),
  );
  await db.insert(rolePermissions).values({
    roleId: 'role',
    companyId: 'company',
    permission: PermissionKeys.CanCreateBookingWithParcels,
  });
  await db.insert(cashierSessions).values(
    ['a', 'b'].map((key) => ({
      id: `session-${key}`,
      cashierId: `cashier-${key}`,
      branchId: 'source',
      scheduledStartTime: new Date(`${REPORT_DATE}T06:00:00Z`),
      actualStartTime: new Date(`${REPORT_DATE}T06:00:00Z`),
      scheduledEndTime: new Date(`${REPORT_DATE}T18:00:00Z`),
      status: 'ACTIVE',
    })),
  );
  await db
    .insert(cashierSessionDelegates)
    .values({ sessionId: 'session-b', userId: 'agent', assignedBy: 'cashier-b' });
  let sequence = 0;
  return {
    cleanup: schema.cleanup,
    async clear() {
      await sql`truncate parcels, bookings, payments, audit_logs, self_service_booking_drafts`;
    },
    async parcel(patch: Partial<typeof parcels.$inferInsert> = {}) {
      const id = `parcel-${++sequence}`;
      await db.insert(bookings).values({
        id: `booking-${sequence}`,
        companyId: 'company',
        sourceId: 'source',
        createdBy: 'agent',
      });
      const [row] = await db
        .insert(parcels)
        .values({
          id,
          companyId: 'company',
          sourceId: 'source',
          sourceLocationId: 'location',
          destinationId: 'destination',
          bookingId: `booking-${sequence}`,
          bookingCode: `BOOK-${sequence}`,
          trackingCode: `TRACK-${sequence}`,
          senderId: 'sender',
          receiverId: 'receiver',
          parcelDetails: 'One box',
          parcelContent: 'Clothes',
          chargePsw: 5000,
          plannedToBePaidPsw: 5000,
          method: PaymentMethod.CASH,
          createdBy: 'agent',
          status: ParcelStatus.CREATED,
          createdAt: new Date(`${REPORT_DATE}T07:00:00Z`),
          ...patch,
        })
        .returning();
      return row!;
    },
    async readParcel(id: string) {
      const [row] = await db.select().from(parcels).where(eq(parcels.id, id));
      return row!;
    },
    async draft() {
      const [draft] = await db
        .insert(selfServiceBookingDrafts)
        .values({
          companyId: 'company',
          branchId: 'source',
          senderFullname: 'sender',
          senderPhone: '0240000001',
          senderCustomerId: 'sender',
          receiverFullname: 'receiver',
          receiverPhone: '0240000002',
          receiverCustomerId: 'receiver',
          destinationBranchId: 'destination',
          parcelContent: 'Clothes',
          expiresAt: new Date(Date.now() + 3600000),
        })
        .returning();
      return draft!;
    },
  };
}
