import { db, sql } from '@/db/config';
import { locations, rolePermissions } from '@/db/schemas';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createMaintenanceBookingFixture } from './maintenance-booking-fixture';
import { signAccessToken } from '@/server/utils/jwt';
import { Elysia } from 'elysia';
import { parcelsRoutes } from '@/server/features/shipments/parcels.routes';
import { errorHandler } from '@/server/middlewares/error-handler';

export async function createReceivingWorkflowFixture() {
  const fixture = await createMaintenanceBookingFixture('vipex_receiving_workflow_test');
  const app = new Elysia().use(errorHandler).group('/parcels', (route) => route.use(parcelsRoutes));
  return {
    ...fixture,
    async reset() {
      await fixture.reset();
      await sql`truncate role_permissions, consignments, consignment_items, bookings`;
      await sql`update users set branch_id = 'destination',status = 0,location_id = null`;
      await sql`update parcels set status = 2`;
      await db
        .insert(rolePermissions)
        .values(
          [
            PermissionKeys.CanReadParcelIncoming,
            PermissionKeys.CanReadParcelScan,
            PermissionKeys.CanUpdateParcels,
          ].map((permission) => ({ companyId: 'company', roleId: 'admin-role', permission })),
        );
    },
    async location(id = 'circle', branchId = 'destination', companyId = 'company') {
      await db.insert(locations).values({ id, companyId, branchId, name: id, createdBy: 'admin' });
    },
    async request(method: string, path: string, body?: unknown) {
      const token = await signAccessToken({ sub: 'admin' });
      return app.handle(
        new Request(`http://localhost/parcels${path}`, {
          method,
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        }),
      );
    },
    async consignment() {
      await sql`insert into consignments (id,company_id,source_id,destination_id,consignment_date,
        serial_for_day,code,created_by) values ('consignment','company','source','destination',
        '2026-10-31',1,'20261031-1','admin')`;
      await sql`insert into consignment_items (consignment_id,parcel_id) values ('consignment','parcel')`;
    },
  };
}
export type ReceivingWorkflowFixture = Awaited<ReturnType<typeof createReceivingWorkflowFixture>>;
