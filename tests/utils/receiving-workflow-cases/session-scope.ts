import { expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { db, sql } from '@/db/config';
import { refreshTokens, rolePermissions } from '@/db/schemas';
import { PermissionKeys } from '@/shared/permissions/constants';
import { signAccessToken } from '@/server/utils/jwt';
import type { ReceivingWorkflowFixture } from '../receiving-workflow-fixture';

async function switchedToken(branchId: string, locationId: string | null) {
  await db.insert(rolePermissions).values({
    companyId: 'company',
    roleId: 'admin-role',
    permission: PermissionKeys.CanSwitchBranch,
  });
  const sid = createId();
  await db.insert(refreshTokens).values({
    id: sid,
    userId: 'admin',
    tokenHash: sid,
    expiresAt: new Date(Date.now() + 60_000),
    permissionsSnapshot: [],
    activeBranchId: branchId,
    activeLocationId: locationId,
  });
  return signAccessToken({
    sub: 'admin',
    sid,
    email: 'admin@example.test',
    roleId: 'admin-role',
    companyId: 'company',
    branchId,
    locationId,
  });
}

export function registerReceivingSessionScopeCases(fixture: () => ReceivingWorkflowFixture) {
  for (const method of ['POST', 'PATCH']) {
    const path = method === 'POST' ? '/parcel/mark-received' : '/parcel';
    test(`${method} arrival uses the switched destination instead of the user's assigned branch`, async () => {
      const f = fixture();
      await f.location();
      await sql`update users set branch_id = 'source' where id = 'admin'`;
      const token = await switchedToken('destination', 'circle');
      const body = method === 'POST' ? { receivedBy: 'forged-user', status: 3 } : { status: 3 };
      const response = await f.request(method, path, body, 'parcels', token);
      expect(response.status).toBe(200);
      expect((await sql`select status, received_by, pickup_location_id from parcels`)[0]).toEqual({
        status: 3,
        received_by: 'admin',
        pickup_location_id: 'circle',
      });
      expect((await sql`select received_at from parcels`)[0]!.received_at).not.toBeNull();
      expect((await sql`select branch_id from users where id = 'admin'`)[0]!.branch_id).toBe(
        'source',
      );
    });

    test(`${method} arrival cannot fall back to the assigned destination after switching away`, async () => {
      const f = fixture();
      const token = await switchedToken('source', null);
      const response = await f.request(method, path, { status: 3 }, 'parcels', token);
      expect(response.status).toBe(404);
      expect((await sql`select status, received_at from parcels`)[0]).toEqual({
        status: 2,
        received_at: null,
      });
    });
  }

  test('switched receiving still rejects foreign-company parcels', async () => {
    const f = fixture();
    await f.location();
    await sql`update users set branch_id = 'source' where id = 'admin'`;
    const token = await switchedToken('destination', 'circle');
    await sql`update parcels set company_id = 'foreign'`;
    const response = await f.request('POST', '/parcel/mark-received', {}, 'parcels', token);
    expect(response.status).toBe(404);
    expect((await sql`select received_at from parcels`)[0]!.received_at).toBeNull();
  });

  test('a revoked branch-switch grant blocks receiving before any writes', async () => {
    const f = fixture();
    await f.location();
    await sql`update users set branch_id = 'source' where id = 'admin'`;
    const token = await switchedToken('destination', 'circle');
    await sql`delete from role_permissions where permission = 'CanSwitchBranch'`;
    const response = await f.request('POST', '/parcel/mark-received', {}, 'parcels', token);
    expect(response.status).toBe(401);
    expect((await sql`select received_at from parcels`)[0]!.received_at).toBeNull();
  });
}
