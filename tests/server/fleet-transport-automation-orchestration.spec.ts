import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  auditLogs,
  BranchType,
  FleetMaintenanceIntervalUnit,
  FleetVehicleLifecycleStatus,
  UserStatus,
  branches,
  companies,
  companyModules,
  fleetMaintenanceParts,
  fleetMaintenancePlans,
  fleetMaintenanceWorkOrders,
  fleetVehicles,
  notificationDispatches,
  ProcurementDemandStatus,
  procurementDemands,
  rolePermissions,
  roles,
  users,
} from '@/db/schemas';
import { HttpStatus } from '@/server/utils/http-status';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createTestAccessToken } from '../utils/auth-session';
import { http, json } from '../utils/request';

describe('Fleet automation orchestration', () => {
  let companyId = '';
  let branchId = '';
  let roleId = '';
  let actorUserId = '';
  let actorEmail = '';
  let accessToken = '';
  let overdueVehicleId = '';
  let recoverVehicleId = '';
  let planId = '';
  let partId = '';

  beforeAll(async () => {
    const now = Date.now();

    const [company] = await db
      .insert(companies)
      .values({
        name: `Fleet Automation Co ${now}`,
        type: 'test',
        code: `FAC${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: companies.id });
    companyId = company!.id;

    const [branch] = await db
      .insert(branches)
      .values({
        companyId,
        name: `Automation Branch ${now}`,
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
        name: `Fleet Automation Role ${now}`,
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
        permission: PermissionKeys.CanUpdateFleetVehicles,
      },
    ]);

    actorEmail = `fleet-automation-actor-${now}@example.com`;
    const [actor] = await db
      .insert(users)
      .values({
        fullname: `Fleet Automation Actor ${now}`,
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
      {
        companyId,
        moduleCode: 'procurement',
        isEnabled: true,
        enabledAt: new Date(),
        disabledAt: null,
        configuredBy: actorUserId,
      },
    ]);

    const [overdueVehicle, recoverVehicle] = await db
      .insert(fleetVehicles)
      .values([
        {
          companyId,
          branchId,
          plateNumber: `GT-AUTO-OD-${now}`,
          model: 'Overdue Insurance Van',
          lifecycleStatus: FleetVehicleLifecycleStatus.ACTIVE,
          insuranceExpiryAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          roadworthyExpiryAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          createdBy: actorUserId,
          isActive: true,
        },
        {
          companyId,
          branchId,
          plateNumber: `GT-AUTO-RC-${now}`,
          model: 'Recoverable Maintenance Van',
          lifecycleStatus: FleetVehicleLifecycleStatus.IN_MAINTENANCE,
          insuranceExpiryAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
          roadworthyExpiryAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
          createdBy: actorUserId,
          isActive: true,
        },
      ])
      .returning({ id: fleetVehicles.id });
    overdueVehicleId = overdueVehicle!.id;
    recoverVehicleId = recoverVehicle!.id;

    const [plan] = await db
      .insert(fleetMaintenancePlans)
      .values({
        companyId,
        vehicleId: recoverVehicleId,
        title: 'Auto PM Plan',
        intervalUnit: FleetMaintenanceIntervalUnit.DAYS,
        intervalValue: 7,
        nextDueAt: new Date(Date.now() - 60 * 60 * 1000),
        isActive: true,
        createdBy: actorUserId,
      })
      .returning({ id: fleetMaintenancePlans.id });
    planId = plan!.id;

    const [part] = await db
      .insert(fleetMaintenanceParts)
      .values({
        companyId,
        branchId,
        sku: `PART-AUTO-${now}`,
        name: 'Automation Brake Pad',
        unit: 'pcs',
        qtyOnHand: 1,
        reorderLevel: 5,
        averageUnitCostPsw: 120,
        isActive: true,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      })
      .returning({ id: fleetMaintenanceParts.id });
    partId = part!.id;

    accessToken = await createTestAccessToken({
      userId: actorUserId,
      email: actorEmail,
      permissions: [PermissionKeys.CanReadFleetTransport, PermissionKeys.CanUpdateFleetVehicles],
      roleId,
      companyId,
      branchId,
      branchType: BranchType.AGENCY,
    });
  });

  afterAll(async () => {
    if (!companyId) return;

    await db.delete(notificationDispatches).where(eq(notificationDispatches.companyId, companyId));
    await db.delete(procurementDemands).where(eq(procurementDemands.companyId, companyId));
    await db
      .delete(fleetMaintenanceWorkOrders)
      .where(eq(fleetMaintenanceWorkOrders.companyId, companyId));
    if (planId) {
      await db
        .delete(fleetMaintenanceWorkOrders)
        .where(eq(fleetMaintenanceWorkOrders.planId, planId));
    }
    await db.delete(fleetMaintenancePlans).where(eq(fleetMaintenancePlans.companyId, companyId));
    await db.delete(fleetMaintenanceParts).where(eq(fleetMaintenanceParts.companyId, companyId));
    await db.delete(fleetVehicles).where(eq(fleetVehicles.companyId, companyId));
    await db.delete(auditLogs).where(eq(auditLogs.companyId, companyId));
    await db.delete(companyModules).where(eq(companyModules.companyId, companyId));
    await db.delete(rolePermissions).where(eq(rolePermissions.companyId, companyId));
    await db.delete(users).where(eq(users.companyId, companyId));
    await db.delete(roles).where(eq(roles.companyId, companyId));
    await db.delete(branches).where(eq(branches.companyId, companyId));
    await db.delete(companies).where(eq(companies.id, companyId));
  });

  test('orchestration job applies lifecycle + maintenance + procurement automation and ops queue reflects it', async () => {
    const headers = {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };

    const orchestratorRes = await http('POST', '/v1/fleet-transport/automation/run-daily', {
      headers,
      body: JSON.stringify({
        dueWithinDays: 0,
        planLimit: 100,
        lifecycleLimit: 100,
        incidentEscalateAfterDays: 3,
        incidentCriticalEscalateAfterDays: 1,
        complianceEscalateAfterDays: 90,
        autoCreateProcurementDemands: true,
        lowStockLimit: 50,
        replenishMultiplier: 1,
      }),
    });
    expect(orchestratorRes.status).toBe(HttpStatus.OK);
    const orchestratorBody = await json<{
      lifecycle: { movedToMaintenance: number; movedToActive: number };
      maintenance: { autoWorkOrdersCreated: number; procurementDemandsCreated: number };
      escalation: { incidentEscalations: number; complianceEscalations: number };
    }>(orchestratorRes);
    expect(orchestratorBody.lifecycle.movedToMaintenance).toBeGreaterThanOrEqual(1);
    expect(orchestratorBody.lifecycle.movedToActive).toBeGreaterThanOrEqual(1);
    expect(orchestratorBody.maintenance.autoWorkOrdersCreated).toBeGreaterThanOrEqual(1);
    expect(orchestratorBody.maintenance.procurementDemandsCreated).toBeGreaterThanOrEqual(1);
    expect(orchestratorBody.escalation.incidentEscalations).toBe(0);
    expect(orchestratorBody.escalation.complianceEscalations).toBe(0);

    const vehicleRows = await db
      .select({
        id: fleetVehicles.id,
        lifecycleStatus: fleetVehicles.lifecycleStatus,
      })
      .from(fleetVehicles)
      .where(eq(fleetVehicles.companyId, companyId));
    const overdueVehicleRow = vehicleRows.find((row) => row.id === overdueVehicleId);
    const recoverVehicleRow = vehicleRows.find((row) => row.id === recoverVehicleId);
    expect(overdueVehicleRow?.lifecycleStatus).toBe(FleetVehicleLifecycleStatus.IN_MAINTENANCE);
    expect(recoverVehicleRow?.lifecycleStatus).toBe(FleetVehicleLifecycleStatus.ACTIVE);

    const workOrderRows = await db
      .select({
        id: fleetMaintenanceWorkOrders.id,
        planId: fleetMaintenanceWorkOrders.planId,
        status: fleetMaintenanceWorkOrders.status,
      })
      .from(fleetMaintenanceWorkOrders)
      .where(eq(fleetMaintenanceWorkOrders.companyId, companyId));
    expect(workOrderRows.some((row) => row.planId === planId)).toBe(true);

    const demandRows = await db
      .select({
        id: procurementDemands.id,
        status: procurementDemands.status,
        sourceEntityId: procurementDemands.sourceEntityId,
      })
      .from(procurementDemands)
      .where(eq(procurementDemands.companyId, companyId));
    expect(demandRows.some((row) => row.sourceEntityId === partId)).toBe(true);
    expect(demandRows.every((row) => row.status === ProcurementDemandStatus.OPEN)).toBe(true);

    const opsQueueRes = await http('GET', '/v1/fleet-transport/ops-queue?horizonDays=30', {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(opsQueueRes.status).toBe(HttpStatus.OK);
    const opsQueue = await json<{
      summary: { lowStockCandidates: number; openWorkOrders: number };
    }>(opsQueueRes);
    expect(opsQueue.summary.lowStockCandidates).toBeGreaterThanOrEqual(1);
    expect(opsQueue.summary.openWorkOrders).toBeGreaterThanOrEqual(1);
  }, 20000);
});
