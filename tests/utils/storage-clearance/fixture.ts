import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  companies,
  branches,
  roles,
  users,
  customers,
  bookings,
  parcels,
  auditLogs,
  parcelStorageClearanceRequests,
  parcelStorageWaivers,
  journalLines,
  journalEntries,
  journalBatches,
  chartOfAccounts,
  rolePermissions,
} from '@/db/schemas';
import { BranchType, ParcelStatus, UserStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';

export async function createStorageClearanceFixture() {
  const companyId = createId();
  const branchId = createId();
  const requester = createId();
  const approver = createId();
  const finance = createId();
  await db.insert(companies).values({
    id: companyId,
    name: companyId,
    type: 'test',
    code: companyId,
    createdBy: requester,
  });
  await db.insert(branches).values({
    id: branchId,
    companyId,
    name: 'Test agency',
    type: BranchType.AGENCY,
    createdBy: requester,
  });
  const actors = [
    { id: requester, permission: PermissionKeys.CanRequestParcelStorageClearance },
    { id: approver, permission: PermissionKeys.CanApproveParcelStorageClearance },
    { id: finance, permission: PermissionKeys.CanExecuteParcelStorageClearance },
  ];
  for (const actor of actors) {
    const roleId = createId();
    await db.insert(roles).values({ id: roleId, companyId, name: roleId, createdBy: requester });
    await db.insert(rolePermissions).values({ companyId, roleId, permission: actor.permission });
    await db.insert(users).values({
      id: actor.id,
      companyId,
      branchId,
      roleId,
      fullname: actor.id,
      email: `${actor.id}@example.test`,
      telephone: actor.id,
      status: UserStatus.ACTIVE,
      createdBy: requester,
    });
  }
  const [customer] = await db
    .insert(customers)
    .values({ companyId, fullname: 'Customer', createdBy: requester })
    .returning();
  const [booking] = await db
    .insert(bookings)
    .values({ companyId, sourceId: branchId, createdBy: requester })
    .returning();
  const parcel = async (days = 5) => {
    const code = createId();
    const [row] = await db
      .insert(parcels)
      .values({
        companyId,
        sourceId: branchId,
        destinationId: branchId,
        bookingId: booking!.id,
        bookingCode: code,
        trackingCode: code,
        senderId: customer!.id,
        receiverId: customer!.id,
        parcelDetails: 'Fixture parcel',
        parcelContent: 'Documents',
        status: ParcelStatus.AWAITING_PICKUP,
        receivedAt: receivedDate(days),
        createdBy: requester,
      })
      .returning();
    return row!;
  };
  const accounting = async (withAccounts: boolean) => {
    await db.update(companies).set({ useAccounting: true }).where(eq(companies.id, companyId));
    if (withAccounts)
      await db.insert(chartOfAccounts).values([
        { companyId, code: '1300', name: 'Receivable' },
        { companyId, code: '5180', name: 'Storage waiver expense' },
      ]);
  };
  const cleanup = async () => {
    await db.delete(auditLogs).where(eq(auditLogs.companyId, companyId));
    await db
      .delete(parcelStorageClearanceRequests)
      .where(eq(parcelStorageClearanceRequests.companyId, companyId));
    await db.delete(parcelStorageWaivers).where(eq(parcelStorageWaivers.companyId, companyId));
    await db.delete(journalLines).where(eq(journalLines.companyId, companyId));
    await db.delete(journalEntries).where(eq(journalEntries.companyId, companyId));
    await db.delete(journalBatches).where(eq(journalBatches.companyId, companyId));
    await db.delete(chartOfAccounts).where(eq(chartOfAccounts.companyId, companyId));
    await db.delete(parcels).where(eq(parcels.companyId, companyId));
    await db.delete(bookings).where(eq(bookings.companyId, companyId));
    await db.delete(customers).where(eq(customers.companyId, companyId));
    await db.delete(rolePermissions).where(eq(rolePermissions.companyId, companyId));
    await db.delete(users).where(eq(users.companyId, companyId));
    await db.delete(roles).where(eq(roles.companyId, companyId));
    await db.delete(branches).where(eq(branches.companyId, companyId));
    await db.delete(companies).where(eq(companies.id, companyId));
  };
  return { companyId, branchId, requester, approver, finance, parcel, accounting, cleanup };
}

export function receivedDate(days: number) {
  return new Date(Date.now() - (14 + days) * 86400000 - 3600000);
}
