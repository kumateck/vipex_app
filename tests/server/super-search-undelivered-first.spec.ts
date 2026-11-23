import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '@/db/config';
import { parcels, rolePermissions } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { routes } from '@/server/features/shipments/parcel-routes/queries';
import { listParcelsRepo } from '@/server/features/shipments/parcel-repositories/parcel-list.repository';
import type { ListParcelsParams } from '@/server/features/shipments/parcels.repository';
import { errorHandler } from '@/server/middlewares/error-handler';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createTestAccessToken } from '../utils/auth-session';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

const statuses = [
  ParcelStatus.DELIVERED_BY_OFFICE,
  ParcelStatus.DELIVERED_AT_HOME,
  ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
  ParcelStatus.AWAITING_PICKUP,
  ParcelStatus.CREATED,
  ParcelStatus.HOME_DELIVERY_REQUESTED,
  ParcelStatus.RETURNED_TO_OFFICE,
];
const app = new Elysia().use(errorHandler).group('/shipments/parcels', (app) => app.use(routes));

describe('Super Search prioritizes undelivered records before pagination', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  let token: string;
  beforeAll(async () => {
    fixture = await createShelfPickupFixture();
    await db.insert(rolePermissions).values({
      companyId: fixture.companyId,
      roleId: fixture.roleId,
      permission: PermissionKeys.CanReadParcels,
    });
    token = await createTestAccessToken({
      userId: fixture.actor,
      permissions: [PermissionKeys.CanReadParcels],
      branchId: fixture.branchId,
      companyId: fixture.companyId,
      roleId: fixture.roleId,
      email: `${fixture.actor}@example.test`,
    });
    for (const [index, status] of statuses.entries()) {
      const parcel = await fixture.parcel();
      await db
        .update(parcels)
        .set({
          status,
          createdAt: new Date(Date.UTC(2026, 0, index + 1)),
        })
        .where(eq(parcels.id, parcel.id));
    }
  });
  afterAll(async () => {
    if (fixture) await fixture.cleanup();
  });
  const search = (options: Partial<ListParcelsParams> = {}) =>
    listParcelsRepo({
      companyId: fixture.companyId,
      search: 'Shelf customer',
      limit: 20,
      offset: 0,
      undeliveredFirst: true,
      ...options,
    });

  test('keeps office, rider handover and home delivery behind undelivered matches across pages', async () => {
    const result = [];
    for (let offset = 0; offset < statuses.length; offset += 2) {
      const page = await search({ limit: 2, offset });
      expect(page.totalRecords).toBe(statuses.length);
      result.push(...page.data.map((row) => row.status));
    }
    expect(result).toEqual([...statuses.slice(3), ...statuses.slice(0, 3)]);
  });

  test('the HTTP query carries the priority through validation and pagination', async () => {
    const response = await app.handle(
      new Request(
        `http://localhost/shipments/parcels?companyId=${fixture.companyId}&search=Shelf%20customer&undeliveredFirst=true&pageSize=2`,
        { headers: { authorization: `Bearer ${token}` } },
      ),
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.map((row: { status: number }) => row.status)).toEqual(statuses.slice(3, 5));
    expect(result.meta.totalRecords).toBe(statuses.length);
  });

  test('preserves the requested order inside each group', async () => {
    const result = await search({ sort: [{ field: 'createdAt', direction: 'desc' }] });
    expect(result.data.map((row) => row.status)).toEqual([
      ...statuses.slice(3).toReversed(),
      ...statuses.slice(0, 3).toReversed(),
    ]);
  });

  test('other parcel lists retain their order when the option is absent or false', async () => {
    for (const undeliveredFirst of [false, undefined]) {
      const result = await search({ undeliveredFirst });
      expect(result.data.map((row) => row.status)).toEqual(statuses);
    }
  });

  test('keeps explicit status filters and delivered-only searches intact', async () => {
    const result = await search({ status: ParcelStatus.DELIVERED_BY_OFFICE });
    expect(result.totalRecords).toBe(1);
    expect(result.data.map((row) => row.status)).toEqual([ParcelStatus.DELIVERED_BY_OFFICE]);
  });
});
