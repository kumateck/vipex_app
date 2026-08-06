import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  auditLogs,
  BranchType,
  ProcurementDemandStatus,
  UserStatus,
  branches,
  companies,
  companyModules,
  procurementDemands,
  procurementPurchaseRequests,
  rolePermissions,
  roles,
  users,
} from '@/db/schemas';
import { HttpStatus } from '@/server/utils/http-status';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createTestAccessToken } from '../utils/auth-session';
import { http, json } from '../utils/request';

describe('Procurement demands conversion', () => {
  let companyId = '';
  let branchId = '';
  let roleId = '';
  let actorUserId = '';
  let actorEmail = '';
  let accessToken = '';

  beforeAll(async () => {
    const now = Date.now();

    const [company] = await db
      .insert(companies)
      .values({
        name: `Procurement Demand Conversion ${now}`,
        type: 'test',
        code: `PDC${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: companies.id });
    companyId = company!.id;

    const [branch] = await db
      .insert(branches)
      .values({
        companyId,
        name: `Proc Branch ${now}`,
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
        name: `Proc Role ${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: roles.id });
    roleId = role!.id;

    await db.insert(rolePermissions).values([
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanReadProcurement,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanCreateProcurementPurchaseRequests,
      },
    ]);

    actorEmail = `proc-actor-${now}@example.com`;
    const [actor] = await db
      .insert(users)
      .values({
        fullname: `Proc Actor ${now}`,
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

    await db.insert(companyModules).values({
      companyId,
      moduleCode: 'procurement',
      isEnabled: true,
      enabledAt: new Date(),
      disabledAt: null,
      configuredBy: actorUserId,
    });

    accessToken = await createTestAccessToken({
      userId: actorUserId,
      email: actorEmail,
      permissions: [
        PermissionKeys.CanReadProcurement,
        PermissionKeys.CanCreateProcurementPurchaseRequests,
      ],
      roleId,
      companyId,
      branchId,
      branchType: BranchType.AGENCY,
    });
  });

  afterAll(async () => {
    if (!companyId) return;
    await db
      .delete(procurementPurchaseRequests)
      .where(eq(procurementPurchaseRequests.companyId, companyId));
    await db.delete(procurementDemands).where(eq(procurementDemands.companyId, companyId));
    await db.delete(auditLogs).where(eq(auditLogs.companyId, companyId));
    await db.delete(companyModules).where(eq(companyModules.companyId, companyId));
    await db.delete(users).where(eq(users.companyId, companyId));
    await db.delete(rolePermissions).where(eq(rolePermissions.companyId, companyId));
    await db.delete(roles).where(eq(roles.companyId, companyId));
    await db.delete(branches).where(eq(branches.companyId, companyId));
    await db.delete(companies).where(eq(companies.id, companyId));
  });

  test('creates demands, converts to PRs, and blocks reconversion', async () => {
    const headers = {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };

    const createDemandARes = await http('POST', '/v1/procurement/demands', {
      headers,
      body: JSON.stringify({
        branchId,
        sourceModule: 'fleet_transport',
        sourceEntityType: 'fleet_maintenance_part',
        sourceEntityId: createId(),
        itemCode: 'FLT-PART-001',
        itemName: 'Brake Pad',
        unit: 'pcs',
        quantity: 2,
        estimatedUnitCostPsw: 120,
      }),
    });
    expect(createDemandARes.status).toBe(HttpStatus.CREATED);
    const demandA = await json<{ id: string; demandNo: string }>(createDemandARes);

    const createDemandBRes = await http('POST', '/v1/procurement/demands', {
      headers,
      body: JSON.stringify({
        branchId,
        sourceModule: 'inventory',
        sourceEntityType: 'stock_item',
        sourceEntityId: createId(),
        itemCode: 'INV-ITEM-101',
        itemName: 'Hydraulic Fluid',
        unit: 'litre',
        quantity: 4,
        estimatedUnitCostPsw: 90,
      }),
    });
    expect(createDemandBRes.status).toBe(HttpStatus.CREATED);
    const demandB = await json<{ id: string; demandNo: string }>(createDemandBRes);

    const convertRes = await http('POST', '/v1/procurement/demands/convert-to-purchase-requests', {
      headers,
      body: JSON.stringify({
        demandIds: [demandA.id, demandB.id],
      }),
    });
    expect(convertRes.status).toBe(HttpStatus.OK);
    const convertBody = await json<{ converted: number; requestIds: string[] }>(convertRes);
    expect(convertBody.converted).toBe(2);
    expect(convertBody.requestIds.length).toBe(2);

    const convertedDemandsRes = await http('GET', '/v1/procurement/demands?status=2', {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(convertedDemandsRes.status).toBe(HttpStatus.OK);
    const convertedDemands = await json<{
      data: Array<{ id: string; status: number }>;
    }>(convertedDemandsRes);
    const convertedIds = new Set(convertedDemands.data.map((row) => row.id));
    expect(convertedIds.has(demandA.id)).toBe(true);
    expect(convertedIds.has(demandB.id)).toBe(true);
    for (const row of convertedDemands.data.filter(
      (item) => item.id === demandA.id || item.id === demandB.id,
    )) {
      expect(row.status).toBe(ProcurementDemandStatus.CONVERTED_TO_REQUEST);
    }

    const purchaseRequestsRes = await http('GET', '/v1/procurement/purchase-requests', {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(purchaseRequestsRes.status).toBe(HttpStatus.OK);
    const purchaseRequests = await json<{
      data: Array<{ id: string }>;
    }>(purchaseRequestsRes);
    const purchaseRequestIds = new Set(purchaseRequests.data.map((row) => row.id));
    expect(purchaseRequestIds.has(convertBody.requestIds[0]!)).toBe(true);
    expect(purchaseRequestIds.has(convertBody.requestIds[1]!)).toBe(true);

    const reconvertRes = await http(
      'POST',
      '/v1/procurement/demands/convert-to-purchase-requests',
      {
        headers,
        body: JSON.stringify({
          demandIds: [demandA.id],
        }),
      },
    );
    expect(reconvertRes.status).toBe(HttpStatus.CONFLICT);
  });
});
