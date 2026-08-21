import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  BranchType,
  EmploymentStatus,
  UserStatus,
  branches,
  companies,
  companyModules,
  employees,
  fleetRoutePlanStops,
  fleetRoutePlans,
  fleetTripCrewAssignments,
  fleetTrips,
  fleetVehicles,
  auditLogs,
  jobTitles,
  rolePermissions,
  roles,
  users,
} from '@/db/schemas';
import { HttpStatus } from '@/server/utils/http-status';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createTestAccessToken } from '../utils/auth-session';
import { http, json } from '../utils/request';

describe('Fleet route planning + trip assignment', () => {
  let companyId = '';
  let branchId = '';
  let roleId = '';
  let actorUserId = '';
  let actorEmail = '';
  let driverJobTitleId = '';
  let driverEmployeeId = '';
  let vehicleId = '';
  let accessToken = '';

  beforeAll(async () => {
    const now = Date.now();

    const [company] = await db
      .insert(companies)
      .values({
        name: `Fleet Route Planning ${now}`,
        type: 'test',
        code: `FRP${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: companies.id });
    companyId = company!.id;

    const [branch] = await db
      .insert(branches)
      .values({
        companyId,
        name: `Fleet Route Branch ${now}`,
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
        name: `Fleet Route Role ${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: roles.id });
    roleId = role!.id;

    await db.insert(rolePermissions).values([
      { companyId, roleId, permission: PermissionKeys.CanCreateFleetRoutePlan },
      { companyId, roleId, permission: PermissionKeys.CanCreateFleetTrip },
      { companyId, roleId, permission: PermissionKeys.CanReadFleetTrip },
      { companyId, roleId, permission: PermissionKeys.CanAssignFleetTripRoute },
    ]);

    actorEmail = `fleet-route-actor-${now}@example.com`;
    const [actor] = await db
      .insert(users)
      .values({
        fullname: `Fleet Route Actor ${now}`,
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

    const [driverJobTitle] = await db
      .insert(jobTitles)
      .values({
        companyId,
        name: `Driver ${now}`,
        code: `DRV-ROUTE-${now}`,
        createdBy: actorUserId,
      })
      .returning({ id: jobTitles.id });
    driverJobTitleId = driverJobTitle!.id;

    const [driver] = await db
      .insert(employees)
      .values({
        companyId,
        employeeNumber: `DRV-ROUTE-${now}`,
        firstName: 'Route',
        lastName: 'Driver',
        displayName: 'Route Driver',
        telephone: `+233${Math.floor(Math.random() * 1_000_000_000)}`,
        hireDate: new Date(),
        employmentStatus: EmploymentStatus.ACTIVE,
        branchId,
        jobTitleId: driverJobTitleId,
        createdBy: actorUserId,
      })
      .returning({ id: employees.id });
    driverEmployeeId = driver!.id;

    const [vehicle] = await db
      .insert(fleetVehicles)
      .values({
        companyId,
        branchId,
        plateNumber: `GT-ROUTE-${now}`,
        model: 'Route Van',
        isActive: true,
        createdBy: actorUserId,
      })
      .returning({ id: fleetVehicles.id });
    vehicleId = vehicle!.id;

    accessToken = await createTestAccessToken({
      userId: actorUserId,
      email: actorEmail,
      permissions: [
        PermissionKeys.CanCreateFleetRoutePlan,
        PermissionKeys.CanCreateFleetTrip,
        PermissionKeys.CanReadFleetTrip,
        PermissionKeys.CanAssignFleetTripRoute,
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
      .delete(fleetTripCrewAssignments)
      .where(eq(fleetTripCrewAssignments.companyId, companyId));
    await db.delete(fleetTrips).where(eq(fleetTrips.companyId, companyId));
    await db.delete(fleetRoutePlanStops).where(eq(fleetRoutePlanStops.companyId, companyId));
    await db.delete(fleetRoutePlans).where(eq(fleetRoutePlans.companyId, companyId));
    await db.delete(fleetVehicles).where(eq(fleetVehicles.companyId, companyId));
    await db.delete(employees).where(eq(employees.companyId, companyId));
    await db.delete(companyModules).where(eq(companyModules.companyId, companyId));
    await db.delete(auditLogs).where(eq(auditLogs.companyId, companyId));
    await db.delete(jobTitles).where(eq(jobTitles.companyId, companyId));
    await db.delete(rolePermissions).where(eq(rolePermissions.companyId, companyId));
    await db.delete(users).where(eq(users.companyId, companyId));
    await db.delete(roles).where(eq(roles.companyId, companyId));
    await db.delete(branches).where(eq(branches.companyId, companyId));
    await db.delete(companies).where(eq(companies.id, companyId));
  });

  test('create route plan and assign/clear it on trip', async () => {
    const authHeaders = {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };

    const createRouteRes = await http('POST', '/v1/fleet-transport/routes/plans', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        name: 'Accra -> Kumasi',
        originLabel: 'Accra',
        destinationLabel: 'Kumasi',
        distanceKm: 250,
        estimatedDurationMin: 300,
        stops: [
          { sequenceNo: 1, label: 'Accra Depot', plannedArrivalOffsetMin: 0 },
          { sequenceNo: 2, label: 'Kumasi Terminal', plannedArrivalOffsetMin: 300 },
        ],
      }),
    });
    expect(createRouteRes.status).toBe(HttpStatus.CREATED);
    const createdRoute = await json<{ id: string }>(createRouteRes);
    expect(createdRoute.id).toBeTruthy();

    const createTripRes = await http('POST', '/v1/fleet-transport/trips', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        vehicleId,
        routePlanId: createdRoute.id,
        driverEmployeeId,
      }),
    });
    expect(createTripRes.status).toBe(HttpStatus.CREATED);
    const createdTrip = await json<{ id: string }>(createTripRes);
    expect(createdTrip.id).toBeTruthy();

    const tripWithRouteRes = await http('GET', `/v1/fleet-transport/trips/${createdTrip.id}`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(tripWithRouteRes.status).toBe(HttpStatus.OK);
    const tripWithRoute = await json<{ routePlanId: string | null; routePlanName: string | null }>(
      tripWithRouteRes,
    );
    expect(tripWithRoute.routePlanId).toBe(createdRoute.id);
    expect(tripWithRoute.routePlanName).toBe('Accra -> Kumasi');

    const clearRouteRes = await http(
      'PUT',
      `/v1/fleet-transport/trips/${createdTrip.id}/route-assignment`,
      {
        headers: authHeaders,
        body: JSON.stringify({ routePlanId: null }),
      },
    );
    expect(clearRouteRes.status).toBe(HttpStatus.OK);

    const tripWithoutRouteRes = await http('GET', `/v1/fleet-transport/trips/${createdTrip.id}`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(tripWithoutRouteRes.status).toBe(HttpStatus.OK);
    const tripWithoutRoute = await json<{ routePlanId: string | null }>(tripWithoutRouteRes);
    expect(tripWithoutRoute.routePlanId).toBeNull();
  });
});
