import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  auditLogs,
  companies,
  branches,
  locations,
  roles,
  rolePermissions,
  users,
  customers,
  bookings,
  parcels,
  pickupQueues,
} from '@/db/schemas';
import { ParcelStatus, UserStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';

export async function createShelfPickupFixture() {
  const companyId = createId(),
    branchId = createId(),
    roleId = createId();
  const actor = createId(),
    oldPicker = createId(),
    newPicker = createId(),
    secondPicker = createId();
  const locationId = createId();
  await db
    .insert(companies)
    .values({ id: companyId, name: companyId, type: 'test', code: companyId, createdBy: actor });
  await db.insert(branches).values({ id: branchId, companyId, name: branchId, createdBy: actor });
  await db
    .insert(locations)
    .values({ id: locationId, companyId, branchId, name: locationId, createdBy: actor });
  await db.insert(roles).values({ id: roleId, companyId, name: roleId, createdBy: actor });
  await db
    .insert(rolePermissions)
    .values({ roleId, companyId, permission: PermissionKeys.CanUpdateParcelShelfPicker });
  for (const id of [actor, oldPicker, newPicker, secondPicker])
    await db.insert(users).values({
      id,
      companyId,
      branchId,
      roleId,
      fullname: id,
      email: `${id}@example.test`,
      telephone: id,
      locationId,
      status: UserStatus.ACTIVE,
      createdBy: actor,
    });
  const [customer] = await db
    .insert(customers)
    .values({ companyId, fullname: 'Shelf customer', createdBy: actor })
    .returning();
  const [booking] = await db
    .insert(bookings)
    .values({ companyId, sourceId: branchId, createdBy: actor })
    .returning();
  const parcel = async (pickerStaffId: string | null = oldPicker) => {
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
        parcelDetails: 'Shelf fixture',
        parcelContent: 'Documents',
        status: ParcelStatus.AWAITING_PICKUP,
        shelfPickerStaffId: pickerStaffId,
        chargePsw: 1000,
        plannedToBePaidPsw: 1000,
        receivedAt: new Date(Date.now() - 19 * 86400000 - 3600000),
        createdBy: actor,
      })
      .returning();
    return row!;
  };
  let ticketNumber = 0;
  const ticket = async (
    parcelId: string,
    options: { ended?: boolean; day?: number; picker?: string } = {},
  ) => {
    const now = new Date();
    const queueDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (options.day ?? 0)),
    );
    const [row] = await db
      .insert(pickupQueues)
      .values({
        companyId,
        branchId,
        locationId,
        parcelId,
        pickerStaffId: options.picker ?? oldPicker,
        paymentBucket: 'RP',
        queueDate,
        queueNumber: ++ticketNumber,
        queueCode: createId(),
        queuedBy: actor,
        endedAt: options.ended ? new Date() : null,
      })
      .returning();
    return row!;
  };
  const cleanup = async () => {
    await db.delete(auditLogs).where(eq(auditLogs.companyId, companyId));
    await db.delete(pickupQueues).where(eq(pickupQueues.companyId, companyId));
    await db.delete(parcels).where(eq(parcels.companyId, companyId));
    await db.delete(bookings).where(eq(bookings.companyId, companyId));
    await db.delete(customers).where(eq(customers.companyId, companyId));
    await db.delete(rolePermissions).where(eq(rolePermissions.companyId, companyId));
    await db.delete(users).where(eq(users.companyId, companyId));
    await db.delete(roles).where(eq(roles.companyId, companyId));
    await db.delete(locations).where(eq(locations.companyId, companyId));
    await db.delete(branches).where(eq(branches.companyId, companyId));
    await db.delete(companies).where(eq(companies.id, companyId));
  };
  return {
    companyId,
    branchId,
    locationId,
    roleId,
    actor,
    oldPicker,
    newPicker,
    secondPicker,
    parcel,
    ticket,
    cleanup,
  };
}
