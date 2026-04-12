import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  auditLogs,
  BranchType,
  UserStatus,
  branches,
  companies,
  companyModules,
  rolePermissions,
  roles,
  users,
} from '@/db/schemas';
import { HttpStatus } from '@/server/utils/http-status';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createTestAccessToken } from '../utils/auth-session';
import { http } from '../utils/request';

describe('Fleet analytics routes RBAC', () => {
  let companyId = '';
  let branchId = '';
  let allowedRoleId = '';
  let blockedRoleId = '';
  let allowedUserId = '';
  let blockedUserId = '';
  let allowedEmail = '';
  let blockedEmail = '';
  let allowedToken = '';
  let blockedToken = '';

  beforeAll(async () => {
    const now = Date.now();

    const [company] = await db
      .insert(companies)
      .values({
        name: `Fleet Analytics RBAC ${now}`,
        type: 'test',
        code: `FARB${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: companies.id });
    companyId = company!.id;

    const [branch] = await db
      .insert(branches)
      .values({
        companyId,
        name: `Fleet Analytics Branch ${now}`,
        type: BranchType.AGENCY,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: branches.id });
    branchId = branch!.id;

    const [allowedRole, blockedRole] = await db
      .insert(roles)
      .values([
        {
          companyId,
          name: `Fleet Analytics Allowed Role ${now}`,
          createdBy: createId(),
          isDeleted: false,
        },
        {
          companyId,
          name: `Fleet Analytics Blocked Role ${now}`,
          createdBy: createId(),
          isDeleted: false,
        },
      ])
      .returning({ id: roles.id });
    allowedRoleId = allowedRole!.id;
    blockedRoleId = blockedRole!.id;

    await db.insert(rolePermissions).values([
      {
        companyId,
        roleId: allowedRoleId,
        permission: PermissionKeys.CanReadFleetTransport,
      },
      {
        // Ensure blocked role has at least one permission so auth fallback
        // does not resolve it to the full catalog.
        companyId,
        roleId: blockedRoleId,
        permission: PermissionKeys.CanReadCustomers,
      },
    ]);

    allowedEmail = `allowed-fleet-${now}@example.com`;
    blockedEmail = `blocked-fleet-${now}@example.com`;
    const [allowedUser, blockedUser] = await db
      .insert(users)
      .values([
        {
          fullname: `Allowed Fleet User ${now}`,
          telephone: `+233${Math.floor(Math.random() * 1_000_000_000)}`,
          email: allowedEmail,
          password: null,
          status: UserStatus.ACTIVE,
          roleId: allowedRoleId,
          companyId,
          branchId,
          locationId: null,
          createdBy: createId(),
        },
        {
          fullname: `Blocked Fleet User ${now}`,
          telephone: `+233${Math.floor(Math.random() * 1_000_000_000)}`,
          email: blockedEmail,
          password: null,
          status: UserStatus.ACTIVE,
          roleId: blockedRoleId,
          companyId,
          branchId,
          locationId: null,
          createdBy: createId(),
        },
      ])
      .returning({ id: users.id });
    allowedUserId = allowedUser!.id;
    blockedUserId = blockedUser!.id;

    await db.insert(companyModules).values([
      {
        companyId,
        moduleCode: 'shipments',
        isEnabled: true,
        enabledAt: new Date(),
        disabledAt: null,
        configuredBy: allowedUserId,
      },
      {
        companyId,
        moduleCode: 'fleet_transport',
        isEnabled: true,
        enabledAt: new Date(),
        disabledAt: null,
        configuredBy: allowedUserId,
      },
    ]);

    allowedToken = await createTestAccessToken({
      userId: allowedUserId,
      email: allowedEmail,
      permissions: [PermissionKeys.CanReadFleetTransport],
      roleId: allowedRoleId,
      companyId,
      branchId,
      branchType: BranchType.AGENCY,
    });
    blockedToken = await createTestAccessToken({
      userId: blockedUserId,
      email: blockedEmail,
      permissions: [PermissionKeys.CanReadCustomers],
      roleId: blockedRoleId,
      companyId,
      branchId,
      branchType: BranchType.AGENCY,
    });
  });

  afterAll(async () => {
    if (!companyId) return;

    await db.delete(auditLogs).where(eq(auditLogs.companyId, companyId));
    await db.delete(companyModules).where(eq(companyModules.companyId, companyId));
    await db.delete(users).where(eq(users.companyId, companyId));
    await db.delete(rolePermissions).where(eq(rolePermissions.companyId, companyId));
    await db.delete(roles).where(eq(roles.companyId, companyId));
    await db.delete(branches).where(eq(branches.companyId, companyId));
    await db.delete(companies).where(eq(companies.id, companyId));
  });

  test('blocked user gets forbidden for analytics routes', async () => {
    const headers = { authorization: `Bearer ${blockedToken}`, 'content-type': 'application/json' };

    const complianceKpisRes = await http('GET', '/v1/fleet-transport/compliance/kpis/trends', {
      headers,
    });
    const fraudSignalsRes = await http(
      'GET',
      '/v1/fleet-transport/fuel-analytics/fraud-signals?rapidRefuelHours=8',
      {
        headers,
      },
    );
    const unitEconomicsRes = await http(
      'GET',
      '/v1/fleet-transport/decision-support/unit-economics',
      {
        headers,
      },
    );
    const snapshotRes = await http('POST', '/v1/fleet-transport/analytics/snapshots/run-daily', {
      headers,
      body: JSON.stringify({}),
    });

    for (const status of [
      complianceKpisRes.status,
      fraudSignalsRes.status,
      unitEconomicsRes.status,
      snapshotRes.status,
    ]) {
      expect(status).toBe(HttpStatus.FORBIDDEN);
    }
  });

  test('allowed user can access analytics routes', async () => {
    const headers = { authorization: `Bearer ${allowedToken}`, 'content-type': 'application/json' };

    const complianceKpisRes = await http('GET', '/v1/fleet-transport/compliance/kpis/trends', {
      headers,
    });
    const fraudSignalsRes = await http(
      'GET',
      `/v1/fleet-transport/fuel-analytics/fraud-signals?branchId=${encodeURIComponent(branchId)}&fuelType=1`,
      {
        headers,
      },
    );
    const unitEconomicsRes = await http(
      'GET',
      '/v1/fleet-transport/decision-support/unit-economics',
      {
        headers,
      },
    );
    const snapshotRes = await http('POST', '/v1/fleet-transport/analytics/snapshots/run-daily', {
      headers,
      body: JSON.stringify({ windowDays: 90 }),
    });

    expect(complianceKpisRes.status).toBe(HttpStatus.OK);
    expect(fraudSignalsRes.status).toBe(HttpStatus.OK);
    expect(unitEconomicsRes.status).toBe(HttpStatus.OK);
    expect(snapshotRes.status).toBe(HttpStatus.OK);
  });
});
