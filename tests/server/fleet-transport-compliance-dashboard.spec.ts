import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, like } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  auditLogs,
  BranchType,
  EmploymentStatus,
  FleetTripStatus,
  UserStatus,
  branches,
  companies,
  companyModules,
  employees,
  fleetDriverComplianceRecords,
  fleetTrips,
  fleetVehicleDocuments,
  fleetVehicles,
  jobTitles,
  notificationDispatches,
  rolePermissions,
  roles,
  users,
} from '@/db/schemas';
import { HttpStatus } from '@/server/utils/http-status';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createTestAccessToken } from '../utils/auth-session';
import { http, json } from '../utils/request';

type ComplianceDashboardResponse = {
  summary: {
    total: number;
    expired: number;
    dueIn7Days: number;
    dueIn30Days: number;
    dueIn60Days: number;
    vehicleAlerts: number;
    driverAlerts: number;
  };
  data: Array<{
    id: string;
    kind: 'vehicle' | 'driver';
    branchId: string | null;
    status: 'expired' | 'due_7' | 'due_30' | 'due_60';
    label: string;
  }>;
};

describe('Fleet compliance dashboard + alert job', () => {
  let companyId = '';
  let branchAId = '';
  let branchBId = '';
  let roleId = '';
  let actorUserId = '';
  let actorEmail = '';
  let accessToken = '';
  let driverEmployeeId = '';

  beforeAll(async () => {
    const now = Date.now();

    const [company] = await db
      .insert(companies)
      .values({
        name: `Fleet Compliance Company ${now}`,
        type: 'test',
        code: `FCC${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: companies.id });
    companyId = company!.id;

    const [branchA, branchB] = await db
      .insert(branches)
      .values([
        {
          companyId,
          name: `Fleet A ${now}`,
          type: BranchType.AGENCY,
          createdBy: createId(),
          isDeleted: false,
        },
        {
          companyId,
          name: `Fleet B ${now}`,
          type: BranchType.AGENCY,
          createdBy: createId(),
          isDeleted: false,
        },
      ])
      .returning({ id: branches.id });
    branchAId = branchA!.id;
    branchBId = branchB!.id;

    const [role] = await db
      .insert(roles)
      .values({
        companyId,
        name: `Fleet Compliance Role ${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: roles.id });
    roleId = role!.id;

    await db.insert(rolePermissions).values({
      companyId,
      roleId,
      permission: PermissionKeys.CanReadFleetTransport,
    });

    actorEmail = `fleet-actor-${now}@example.com`;
    const [actor, recipientTwo] = await db
      .insert(users)
      .values([
        {
          fullname: `Fleet Actor ${now}`,
          telephone: `+233${Math.floor(Math.random() * 1_000_000_000)}`,
          email: actorEmail,
          password: null,
          status: UserStatus.ACTIVE,
          roleId,
          companyId,
          branchId: branchAId,
          locationId: null,
          createdBy: createId(),
        },
        {
          fullname: `Fleet Recipient ${now}`,
          telephone: `+233${Math.floor(Math.random() * 1_000_000_000)}`,
          email: `fleet-recipient-${now}@example.com`,
          password: null,
          status: UserStatus.ACTIVE,
          roleId,
          companyId,
          branchId: branchAId,
          locationId: null,
          createdBy: createId(),
        },
      ])
      .returning({ id: users.id });
    actorUserId = actor!.id;
    void recipientTwo;

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

    const [driverJob] = await db
      .insert(jobTitles)
      .values({
        companyId,
        name: `Driver ${now}`,
        code: `DRV-CMP-${now}`,
        createdBy: actorUserId,
      })
      .returning({ id: jobTitles.id });

    const [driver] = await db
      .insert(employees)
      .values({
        companyId,
        employeeNumber: `DRV-CMP-${now}`,
        firstName: 'Compliance',
        lastName: 'Driver',
        displayName: 'Compliance Driver',
        telephone: `+233${Math.floor(Math.random() * 1_000_000_000)}`,
        hireDate: new Date(),
        employmentStatus: EmploymentStatus.ACTIVE,
        branchId: branchAId,
        jobTitleId: driverJob!.id,
        createdBy: actorUserId,
      })
      .returning({ id: employees.id });
    driverEmployeeId = driver!.id;

    const [vehicleExpired, vehicleDue7, vehicleDue30] = await db
      .insert(fleetVehicles)
      .values([
        {
          companyId,
          branchId: branchAId,
          plateNumber: `GT-EXP-${now}`,
          model: 'Expired Van',
          insuranceExpiryAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          assignedDriverUserId: null,
          isActive: true,
          createdBy: actorUserId,
        },
        {
          companyId,
          branchId: branchAId,
          plateNumber: `GT-D7-${now}`,
          model: 'Soon Van',
          roadworthyExpiryAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          assignedDriverUserId: null,
          isActive: true,
          createdBy: actorUserId,
        },
        {
          companyId,
          branchId: branchBId,
          plateNumber: `GT-D30-${now}`,
          model: 'Thirty Van',
          assignedDriverUserId: null,
          isActive: true,
          createdBy: actorUserId,
        },
      ])
      .returning({ id: fleetVehicles.id });
    void vehicleDue7;

    await db.insert(fleetVehicleDocuments).values({
      companyId,
      vehicleId: vehicleDue30!.id,
      documentType: 'Permit',
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      createdBy: actorUserId,
    });

    await db.insert(fleetDriverComplianceRecords).values({
      companyId,
      employeeId: driverEmployeeId,
      complianceType: 0,
      expiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      createdBy: actorUserId,
    });

    await db.insert(fleetTrips).values({
      companyId,
      branchId: branchAId,
      tripNo: `TR-CMP-${now}`,
      vehicleId: vehicleExpired!.id,
      driverEmployeeId,
      status: FleetTripStatus.PLANNED,
      createdBy: actorUserId,
      updatedBy: actorUserId,
    });

    accessToken = await createTestAccessToken({
      userId: actorUserId,
      email: actorEmail,
      permissions: [PermissionKeys.CanReadFleetTransport],
      roleId,
      companyId,
      branchId: branchAId,
      branchType: BranchType.AGENCY,
    });
  });

  afterAll(async () => {
    if (!companyId) return;

    await db.delete(notificationDispatches).where(eq(notificationDispatches.companyId, companyId));
    await db.delete(fleetTrips).where(eq(fleetTrips.companyId, companyId));
    await db
      .delete(fleetDriverComplianceRecords)
      .where(eq(fleetDriverComplianceRecords.companyId, companyId));
    await db.delete(fleetVehicleDocuments).where(eq(fleetVehicleDocuments.companyId, companyId));
    await db.delete(fleetVehicles).where(eq(fleetVehicles.companyId, companyId));
    await db.delete(employees).where(eq(employees.companyId, companyId));
    await db.delete(auditLogs).where(eq(auditLogs.companyId, companyId));
    await db.delete(jobTitles).where(eq(jobTitles.companyId, companyId));
    await db.delete(companyModules).where(eq(companyModules.companyId, companyId));
    await db.delete(users).where(eq(users.companyId, companyId));
    await db.delete(rolePermissions).where(eq(rolePermissions.companyId, companyId));
    await db.delete(roles).where(eq(roles.companyId, companyId));
    await db.delete(branches).where(eq(branches.companyId, companyId));
    await db.delete(companies).where(eq(companies.id, companyId));
  });

  test('lists unified dashboard alerts with branch + status filters', async () => {
    const headers = { authorization: `Bearer ${accessToken}` };

    const allRes = await http(
      'GET',
      '/v1/fleet-transport/compliance-dashboard?horizonDays=60&limit=200',
      {
        headers,
      },
    );
    expect(allRes.status).toBe(HttpStatus.OK);
    const allPayload = await json<ComplianceDashboardResponse>(allRes);
    expect(allPayload.summary.total).toBe(4);
    expect(allPayload.summary.expired).toBeGreaterThanOrEqual(1);
    expect(allPayload.summary.vehicleAlerts).toBe(3);
    expect(allPayload.summary.driverAlerts).toBe(1);

    const due30Res = await http('GET', '/v1/fleet-transport/compliance-dashboard?status=due_30', {
      headers,
    });
    expect(due30Res.status).toBe(HttpStatus.OK);
    const due30Payload = await json<ComplianceDashboardResponse>(due30Res);
    expect(due30Payload.data.some((row) => row.status === 'due_7')).toBe(true);
    expect(due30Payload.data.some((row) => row.status === 'due_30')).toBe(true);
    expect(due30Payload.data.some((row) => row.status === 'expired')).toBe(false);

    const branchRes = await http(
      'GET',
      `/v1/fleet-transport/compliance-dashboard?branchId=${encodeURIComponent(branchAId)}&horizonDays=60`,
      { headers },
    );
    expect(branchRes.status).toBe(HttpStatus.OK);
    const branchPayload = await json<ComplianceDashboardResponse>(branchRes);
    expect(branchPayload.data.every((row) => row.branchId === branchAId)).toBe(true);
    expect(branchPayload.summary.total).toBe(3);
  });

  test('runs compliance alert job and creates in-app/email dispatches', async () => {
    const res = await http('POST', '/v1/fleet-transport/compliance-dashboard/alerts/run-daily', {
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ horizonDays: 60, recipientLimit: 2 }),
    });
    expect(res.status).toBe(HttpStatus.OK);
    const payload = await json<{
      recipients: number;
      inAppCreated: number;
      emailSent: number;
      emailFailed: number;
    }>(res);

    expect(payload.recipients).toBe(2);
    expect(payload.inAppCreated).toBe(2);
    expect(payload.emailSent + payload.emailFailed).toBe(2);

    const rows = await db
      .select({
        channel: notificationDispatches.channel,
        status: notificationDispatches.status,
      })
      .from(notificationDispatches)
      .where(
        and(
          eq(notificationDispatches.companyId, companyId),
          like(notificationDispatches.subject, 'Fleet Compliance Alerts%'),
        ),
      );

    expect(rows.filter((row) => row.channel === 'in_app').length).toBe(2);
    expect(rows.filter((row) => row.channel === 'email').length).toBe(2);
    expect(rows.filter((row) => row.channel === 'in_app' && row.status === 'sent').length).toBe(2);
  }, 20000);
});
