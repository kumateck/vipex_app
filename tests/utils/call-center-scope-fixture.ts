import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, locations, parcels, rolePermissions, users } from '@/db/schemas';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createTestAccessToken } from './auth-session';
import { createShelfPickupFixture } from './shelf-pickup-fixture';

export async function createCallCenterScopeFixture() {
  const fixture = await createShelfPickupFixture();
  const otherLocationId = createId();
  const otherBranchId = createId();
  await db.insert(branches).values({
    id: otherBranchId,
    companyId: fixture.companyId,
    name: 'Other branch',
    createdBy: fixture.actor,
  });
  await db.insert(locations).values({
    id: otherLocationId,
    companyId: fixture.companyId,
    branchId: fixture.branchId,
    name: 'Anloga junction',
    createdBy: fixture.actor,
  });
  await db
    .update(users)
    .set({ locationId: otherLocationId })
    .where(eq(users.id, fixture.newPicker));
  await db.update(users).set({ locationId: null }).where(eq(users.id, fixture.secondPicker));
  await db
    .insert(rolePermissions)
    .values(
      [
        PermissionKeys.CanReadCallCenterAssignment,
        PermissionKeys.CanAssignCallCenterParcels,
        PermissionKeys.CanReadCallCenterParcelStatus,
        PermissionKeys.CanReadParcels,
      ].map((permission) => ({ roleId: fixture.roleId, companyId: fixture.companyId, permission })),
    );

  const token = (userId = fixture.actor) =>
    createTestAccessToken({
      userId,
      email: `${userId}@example.test`,
      permissions: [],
    });
  const parcel = async (
    pickupLocationId: string | null = fixture.locationId,
    destinationId = fixture.branchId,
  ) => {
    const row = await fixture.parcel();
    const [updated] = await db
      .update(parcels)
      .set({
        pickupLocationId,
        destinationId,
        callCenterAssignedToUserId: fixture.actor,
      })
      .where(eq(parcels.id, row.id))
      .returning();
    return updated!;
  };
  return { ...fixture, otherLocationId, otherBranchId, token, parcel };
}
