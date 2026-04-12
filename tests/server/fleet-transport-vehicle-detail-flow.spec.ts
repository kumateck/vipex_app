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
  fleetVehicleDocuments,
  fleetVehicles,
  rolePermissions,
  roles,
  users,
} from '@/db/schemas';
import { HttpStatus } from '@/server/utils/http-status';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createTestAccessToken } from '../utils/auth-session';
import { http, json } from '../utils/request';

describe('Fleet vehicle detail flow', () => {
  let companyId = '';
  let branchId = '';
  let roleId = '';
  let actorUserId = '';
  let actorEmail = '';
  let accessToken = '';
  let vehicleId = '';

  beforeAll(async () => {
    const now = Date.now();
    const [company] = await db
      .insert(companies)
      .values({
        name: `Fleet Vehicle Detail Co ${now}`,
        type: 'test',
        code: `FVDC${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: companies.id });
    companyId = company!.id;

    const [branch] = await db
      .insert(branches)
      .values({
        companyId,
        name: `Fleet Branch ${now}`,
        type: BranchType.AGENCY,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: branches.id });
    branchId = branch!.id;

    const [role] = await db
      .insert(roles)
      .values({
        companyId,
        name: `Fleet Vehicle Role ${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: roles.id });
    roleId = role!.id;

    await db.insert(rolePermissions).values([
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanReadFleetTransport,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanCreateFleetVehicles,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanUpdateFleetVehicles,
      },
    ]);

    actorEmail = `fleet-vehicle-actor-${now}@example.com`;
    const [actor] = await db
      .insert(users)
      .values({
        fullname: `Fleet Vehicle Actor ${now}`,
        telephone: `+233${Math.floor(Math.random() * 1_000_000_000)}`,
        email: actorEmail,
        password: null,
        status: UserStatus.ACTIVE,
        roleId,
        companyId,
        branchId,
        locationId: null,
        createdBy: createId(),
      })
      .returning({ id: users.id });
    actorUserId = actor!.id;

    await db.insert(companyModules).values([
      {
        companyId,
        moduleCode: 'shipments',
        isEnabled: true,
        enabledAt: new Date(),
        disabledAt: null,
        configuredBy: actorUserId,
      },
      {
        companyId,
        moduleCode: 'fleet_transport',
        isEnabled: true,
        enabledAt: new Date(),
        disabledAt: null,
        configuredBy: actorUserId,
      },
    ]);

    accessToken = await createTestAccessToken({
      userId: actorUserId,
      email: actorEmail,
      permissions: [
        PermissionKeys.CanReadFleetTransport,
        PermissionKeys.CanCreateFleetVehicles,
        PermissionKeys.CanUpdateFleetVehicles,
      ],
      roleId,
      companyId,
      branchId,
      branchType: BranchType.AGENCY,
    });
  });

  afterAll(async () => {
    if (!companyId) return;

    await db.delete(fleetVehicleDocuments).where(eq(fleetVehicleDocuments.companyId, companyId));
    await db.delete(fleetVehicles).where(eq(fleetVehicles.companyId, companyId));
    await db.delete(auditLogs).where(eq(auditLogs.companyId, companyId));
    await db.delete(companyModules).where(eq(companyModules.companyId, companyId));
    await db.delete(users).where(eq(users.companyId, companyId));
    await db.delete(rolePermissions).where(eq(rolePermissions.companyId, companyId));
    await db.delete(roles).where(eq(roles.companyId, companyId));
    await db.delete(branches).where(eq(branches.companyId, companyId));
    await db.delete(companies).where(eq(companies.id, companyId));
  });

  test('create vehicle -> add document -> read vehicle detail + documents', async () => {
    const authHeaders = {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };

    const createVehicleRes = await http('POST', '/v1/fleet-transport/vehicles', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        plateNumber: `GT-VIEW-${Date.now()}`,
        model: 'Detail Test Van',
        fuelType: 1,
        lifecycleStatus: 0,
      }),
    });
    expect(createVehicleRes.status).toBe(HttpStatus.CREATED);
    const createdVehicle = await json<{ id: string }>(createVehicleRes);
    vehicleId = createdVehicle.id;

    const createDocRes = await http('POST', `/v1/fleet-transport/vehicles/${vehicleId}/documents`, {
      headers: authHeaders,
      body: JSON.stringify({
        documentType: 'Insurance',
        documentNumber: 'INS-123',
      }),
    });
    expect(createDocRes.status).toBe(HttpStatus.CREATED);

    const vehicleDetailRes = await http('GET', `/v1/fleet-transport/vehicles/${vehicleId}`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(vehicleDetailRes.status).toBe(HttpStatus.OK);
    const detail = await json<{
      id: string;
      plateNumber: string;
      model: string;
      createdAt: string;
    }>(vehicleDetailRes);
    expect(detail.id).toBe(vehicleId);
    expect(detail.plateNumber).toContain('GT-VIEW-');
    expect(detail.model).toBe('Detail Test Van');
    expect(new Date(detail.createdAt).toString()).not.toBe('Invalid Date');

    const docsRes = await http('GET', `/v1/fleet-transport/vehicles/${vehicleId}/documents`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(docsRes.status).toBe(HttpStatus.OK);
    const docs =
      await json<Array<{ documentType: string; documentNumber: string | null }>>(docsRes);
    expect(docs.length).toBe(1);
    expect(docs[0]?.documentType).toBe('Insurance');
    expect(docs[0]?.documentNumber).toBe('INS-123');
  });
});
