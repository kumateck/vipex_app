import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  BranchType,
  EmploymentStatus,
  FleetTripStatus,
  UserStatus,
  branches,
  companies,
  companyModules,
  employees,
  fleetTripCrewAssignments,
  fleetTripEvents,
  fleetTripLoadMatches,
  fleetTripStatusUpdates,
  fleetTripTelemetryPoints,
  fleetTrips,
  fleetVehicles,
  fleetShiftRosters,
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

describe('Fleet trips lifecycle (authenticated)', () => {
  let companyId = '';
  let branchId = '';
  let roleId = '';
  let driverJobTitleId = '';
  let crewJobTitleId = '';
  let actorUserId = '';
  let actorEmail = '';
  let driverEmployeeId = '';
  let crewEmployeeId = '';
  let vehicleId = '';
  let accessToken = '';

  beforeAll(async () => {
    const now = Date.now();

    const [company] = await db
      .insert(companies)
      .values({
        name: `Fleet Test Company ${now}`,
        type: 'test',
        code: `FTC${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: companies.id });
    companyId = company!.id;

    const [branch] = await db
      .insert(branches)
      .values({
        companyId,
        name: `Fleet Test Branch ${now}`,
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
        name: `Fleet Test Role ${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: roles.id });
    roleId = role!.id;

    await db.insert(rolePermissions).values([
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanCreateFleetTrip,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanAssignFleetTripCrew,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanStartFleetTrip,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanCloseFleetTrip,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanCheckInFleetTrip,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanCheckOutFleetTrip,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanRecordFleetTripTelemetry,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanRecordFleetTripStatusUpdate,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanReadFleetTripEvents,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanReadFleetTripTimeline,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanReadFleetTrip,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanReadFleetTripCrew,
      },
      {
        companyId,
        roleId,
        permission: PermissionKeys.CanCreateFleetRoster,
      },
    ]);

    actorEmail = `fleet-actor-${now}@example.com`;
    const [actor] = await db
      .insert(users)
      .values({
        fullname: `Fleet Actor ${now}`,
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

    const [driverJobTitle] = await db
      .insert(jobTitles)
      .values({
        companyId,
        name: `Driver ${now}`,
        code: `DRV-${now}`,
        createdBy: actorUserId,
      })
      .returning({ id: jobTitles.id });
    driverJobTitleId = driverJobTitle!.id;

    const [crewJobTitle] = await db
      .insert(jobTitles)
      .values({
        companyId,
        name: `Crew ${now}`,
        code: `CRW-${now}`,
        createdBy: actorUserId,
      })
      .returning({ id: jobTitles.id });
    crewJobTitleId = crewJobTitle!.id;

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

    const [driver] = await db
      .insert(employees)
      .values({
        companyId,
        employeeNumber: `DRV-${now}`,
        firstName: 'Driver',
        lastName: 'One',
        displayName: 'Driver One',
        telephone: `+233${Math.floor(Math.random() * 1_000_000_000)}`,
        hireDate: new Date(),
        employmentStatus: EmploymentStatus.ACTIVE,
        branchId,
        jobTitleId: driverJobTitleId,
        createdBy: actorUserId,
      })
      .returning({ id: employees.id });
    driverEmployeeId = driver!.id;

    const [crew] = await db
      .insert(employees)
      .values({
        companyId,
        employeeNumber: `CRW-${now}`,
        firstName: 'Crew',
        lastName: 'One',
        displayName: 'Crew One',
        telephone: `+233${Math.floor(Math.random() * 1_000_000_000)}`,
        hireDate: new Date(),
        employmentStatus: EmploymentStatus.ACTIVE,
        branchId,
        jobTitleId: crewJobTitleId,
        createdBy: actorUserId,
      })
      .returning({ id: employees.id });
    crewEmployeeId = crew!.id;

    const [vehicle] = await db
      .insert(fleetVehicles)
      .values({
        companyId,
        branchId,
        plateNumber: `GT-${now}`,
        model: 'Transit Van',
        assignedDriverUserId: null,
        isActive: true,
        createdBy: actorUserId,
      })
      .returning({ id: fleetVehicles.id });
    vehicleId = vehicle!.id;

    accessToken = await createTestAccessToken({
      userId: actorUserId,
      email: actorEmail,
      permissions: [
        PermissionKeys.CanCreateFleetTrip,
        PermissionKeys.CanAssignFleetTripCrew,
        PermissionKeys.CanStartFleetTrip,
        PermissionKeys.CanCloseFleetTrip,
        PermissionKeys.CanCheckInFleetTrip,
        PermissionKeys.CanCheckOutFleetTrip,
        PermissionKeys.CanRecordFleetTripTelemetry,
        PermissionKeys.CanRecordFleetTripStatusUpdate,
        PermissionKeys.CanReadFleetTripEvents,
        PermissionKeys.CanReadFleetTripTimeline,
        PermissionKeys.CanReadFleetTrip,
        PermissionKeys.CanReadFleetTripCrew,
        PermissionKeys.CanCreateFleetRoster,
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
      .delete(fleetTripTelemetryPoints)
      .where(eq(fleetTripTelemetryPoints.companyId, companyId));
    await db.delete(fleetTripStatusUpdates).where(eq(fleetTripStatusUpdates.companyId, companyId));
    await db.delete(fleetTripLoadMatches).where(eq(fleetTripLoadMatches.companyId, companyId));
    await db.delete(fleetTripEvents).where(eq(fleetTripEvents.companyId, companyId));
    await db.delete(fleetShiftRosters).where(eq(fleetShiftRosters.companyId, companyId));
    await db
      .delete(fleetTripCrewAssignments)
      .where(eq(fleetTripCrewAssignments.companyId, companyId));
    await db.delete(fleetTrips).where(eq(fleetTrips.companyId, companyId));
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

  test('create -> assign crew -> start -> check events -> close', async () => {
    const authHeaders = {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };

    const createRes = await http('POST', '/v1/fleet-transport/trips', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        vehicleId,
        driverEmployeeId,
        plannedStartAt: new Date().toISOString(),
        note: 'Lifecycle test trip',
      }),
    });
    expect(createRes.status).toBe(HttpStatus.CREATED);

    const created = await json<{ id: string }>(createRes);
    expect(created.id).toBeTruthy();

    const crewRes = await http('PUT', `/v1/fleet-transport/trips/${created.id}/crew`, {
      headers: authHeaders,
      body: JSON.stringify({ crewEmployeeIds: [crewEmployeeId] }),
    });
    expect(crewRes.status).toBe(HttpStatus.OK);

    const startRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/start`, {
      headers: authHeaders,
      body: JSON.stringify({ startOdometerKm: 100 }),
    });
    expect(startRes.status).toBe(HttpStatus.OK);

    const checkInRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/check-in`, {
      headers: authHeaders,
      body: JSON.stringify({ odometerKm: 105, locationLabel: 'First checkpoint' }),
    });
    expect(checkInRes.status).toBe(HttpStatus.CREATED);

    const checkOutRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/check-out`, {
      headers: authHeaders,
      body: JSON.stringify({ odometerKm: 110, locationLabel: 'First checkpoint departure' }),
    });
    expect(checkOutRes.status).toBe(HttpStatus.CREATED);

    const telemetryRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/telemetry`, {
      headers: authHeaders,
      body: JSON.stringify({ latitude: 5.5602, longitude: -0.205 }),
    });
    expect(telemetryRes.status).toBe(HttpStatus.CREATED);

    const statusUpdateRes = await http(
      'POST',
      `/v1/fleet-transport/trips/${created.id}/status-updates`,
      {
        headers: authHeaders,
        body: JSON.stringify({ statusType: 0, locationLabel: 'Tema Motorway' }),
      },
    );
    expect(statusUpdateRes.status).toBe(HttpStatus.CREATED);

    const eventsRes = await http('GET', `/v1/fleet-transport/trips/${created.id}/events`, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    expect(eventsRes.status).toBe(HttpStatus.OK);

    const events = await json<Array<{ eventType: number }>>(eventsRes);
    expect(events.some((event) => event.eventType === 0)).toBe(true);
    expect(events.some((event) => event.eventType === 1)).toBe(true);

    const timelineRes = await http('GET', `/v1/fleet-transport/trips/${created.id}/timeline`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(timelineRes.status).toBe(HttpStatus.OK);
    const timeline = await json<Array<{ kind: string }>>(timelineRes);
    expect(timeline.some((entry) => entry.kind === 'telemetry')).toBe(true);
    expect(timeline.some((entry) => entry.kind === 'status_update')).toBe(true);

    const closeRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/close`, {
      headers: authHeaders,
      body: JSON.stringify({ endOdometerKm: 140 }),
    });
    expect(closeRes.status).toBe(HttpStatus.OK);

    const afterCloseCheckInRes = await http(
      'POST',
      `/v1/fleet-transport/trips/${created.id}/check-in`,
      {
        headers: authHeaders,
        body: JSON.stringify({ odometerKm: 142 }),
      },
    );
    expect(afterCloseCheckInRes.status).toBe(HttpStatus.CONFLICT);

    const getTripRes = await http('GET', `/v1/fleet-transport/trips/${created.id}`, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    expect(getTripRes.status).toBe(HttpStatus.OK);

    const trip = await json<{
      id: string;
      status: number;
      startedAt: string | null;
      endedAt: string | null;
      startOdometerKm: number | null;
      endOdometerKm: number | null;
    }>(getTripRes);

    expect(trip.id).toBe(created.id);
    expect(trip.status).toBe(2);
    expect(trip.startedAt).toBeTruthy();
    expect(trip.endedAt).toBeTruthy();
    expect(trip.startOdometerKm).toBe(100);
    expect(trip.endOdometerKm).toBe(140);

    const crewListRes = await http('GET', `/v1/fleet-transport/trips/${created.id}/crew`, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    expect(crewListRes.status).toBe(HttpStatus.OK);

    const crew = await json<Array<{ employeeId: string }>>(crewListRes);
    expect(crew.some((member) => member.employeeId === crewEmployeeId)).toBe(true);
  });

  test('rejects trip creation when driver employee is not a Driver job title', async () => {
    const authHeaders = {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };

    const createRes = await http('POST', '/v1/fleet-transport/trips', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        vehicleId,
        driverEmployeeId: crewEmployeeId,
      }),
    });
    expect(createRes.status).toBe(HttpStatus.CONFLICT);
  });

  test('rejects assigning crew when trip is completed or cancelled', async () => {
    const authHeaders = {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };

    const createRes = await http('POST', '/v1/fleet-transport/trips', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        vehicleId,
        driverEmployeeId,
      }),
    });
    expect(createRes.status).toBe(HttpStatus.CREATED);
    const created = await json<{ id: string }>(createRes);

    const startRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/start`, {
      headers: authHeaders,
      body: JSON.stringify({ startOdometerKm: 200 }),
    });
    expect(startRes.status).toBe(HttpStatus.OK);

    const closeRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/close`, {
      headers: authHeaders,
      body: JSON.stringify({ endOdometerKm: 230 }),
    });
    expect(closeRes.status).toBe(HttpStatus.OK);

    const crewRes = await http('PUT', `/v1/fleet-transport/trips/${created.id}/crew`, {
      headers: authHeaders,
      body: JSON.stringify({ crewEmployeeIds: [crewEmployeeId] }),
    });
    expect(crewRes.status).toBe(HttpStatus.CONFLICT);

    const createCancelledRes = await http('POST', '/v1/fleet-transport/trips', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        vehicleId,
        driverEmployeeId,
      }),
    });
    expect(createCancelledRes.status).toBe(HttpStatus.CREATED);
    const cancelled = await json<{ id: string }>(createCancelledRes);

    await db
      .update(fleetTrips)
      .set({ status: FleetTripStatus.CANCELLED })
      .where(eq(fleetTrips.id, cancelled.id));

    const cancelledCrewRes = await http('PUT', `/v1/fleet-transport/trips/${cancelled.id}/crew`, {
      headers: authHeaders,
      body: JSON.stringify({ crewEmployeeIds: [crewEmployeeId] }),
    });
    expect(cancelledCrewRes.status).toBe(HttpStatus.CONFLICT);
  });

  test('rejects close for planned trip', async () => {
    const authHeaders = {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };

    const createRes = await http('POST', '/v1/fleet-transport/trips', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        vehicleId,
        driverEmployeeId,
      }),
    });
    expect(createRes.status).toBe(HttpStatus.CREATED);
    const created = await json<{ id: string }>(createRes);

    const closeRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/close`, {
      headers: authHeaders,
      body: JSON.stringify({ endOdometerKm: 300 }),
    });
    expect(closeRes.status).toBe(HttpStatus.CONFLICT);
  });

  test('rejects close when end odometer is less than start odometer', async () => {
    const authHeaders = {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };

    const createRes = await http('POST', '/v1/fleet-transport/trips', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        vehicleId,
        driverEmployeeId,
      }),
    });
    expect(createRes.status).toBe(HttpStatus.CREATED);
    const created = await json<{ id: string }>(createRes);

    const startRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/start`, {
      headers: authHeaders,
      body: JSON.stringify({ startOdometerKm: 500 }),
    });
    expect(startRes.status).toBe(HttpStatus.OK);

    const closeRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/close`, {
      headers: authHeaders,
      body: JSON.stringify({ endOdometerKm: 450 }),
    });
    expect(closeRes.status).toBe(HttpStatus.CONFLICT);

    const closeCleanupRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/close`, {
      headers: authHeaders,
      body: JSON.stringify({ endOdometerKm: 550 }),
    });
    expect(closeCleanupRes.status).toBe(HttpStatus.OK);
  });

  test('rejects start for completed and cancelled trips', async () => {
    const authHeaders = {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };

    const createRes = await http('POST', '/v1/fleet-transport/trips', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        vehicleId,
        driverEmployeeId,
      }),
    });
    expect(createRes.status).toBe(HttpStatus.CREATED);
    const created = await json<{ id: string }>(createRes);

    const startRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/start`, {
      headers: authHeaders,
      body: JSON.stringify({ startOdometerKm: 800 }),
    });
    expect(startRes.status).toBe(HttpStatus.OK);

    const closeRes = await http('POST', `/v1/fleet-transport/trips/${created.id}/close`, {
      headers: authHeaders,
      body: JSON.stringify({ endOdometerKm: 850 }),
    });
    expect(closeRes.status).toBe(HttpStatus.OK);

    const restartCompletedRes = await http(
      'POST',
      `/v1/fleet-transport/trips/${created.id}/start`,
      {
        headers: authHeaders,
        body: JSON.stringify({ startOdometerKm: 860 }),
      },
    );
    expect(restartCompletedRes.status).toBe(HttpStatus.CONFLICT);

    const createCancelledRes = await http('POST', '/v1/fleet-transport/trips', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        vehicleId,
        driverEmployeeId,
      }),
    });
    expect(createCancelledRes.status).toBe(HttpStatus.CREATED);
    const cancelled = await json<{ id: string }>(createCancelledRes);

    await db
      .update(fleetTrips)
      .set({ status: FleetTripStatus.CANCELLED })
      .where(eq(fleetTrips.id, cancelled.id));

    const restartCancelledRes = await http(
      'POST',
      `/v1/fleet-transport/trips/${cancelled.id}/start`,
      {
        headers: authHeaders,
        body: JSON.stringify({ startOdometerKm: 900 }),
      },
    );
    expect(restartCancelledRes.status).toBe(HttpStatus.CONFLICT);
  });

  test('shift rosters enforce overlap conflicts', async () => {
    const authHeaders = {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };

    const shiftStartAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const shiftEndAt = new Date(shiftStartAt.getTime() + 4 * 60 * 60 * 1000);

    const createRes = await http('POST', '/v1/fleet-transport/rosters', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        employeeId: driverEmployeeId,
        vehicleId,
        roleType: 0,
        shiftStartAt: shiftStartAt.toISOString(),
        shiftEndAt: shiftEndAt.toISOString(),
      }),
    });
    expect(createRes.status).toBe(HttpStatus.CREATED);

    const overlapRes = await http('POST', '/v1/fleet-transport/rosters', {
      headers: authHeaders,
      body: JSON.stringify({
        branchId,
        employeeId: driverEmployeeId,
        vehicleId,
        roleType: 0,
        shiftStartAt: new Date(shiftStartAt.getTime() + 60 * 60 * 1000).toISOString(),
        shiftEndAt: new Date(shiftEndAt.getTime() + 60 * 60 * 1000).toISOString(),
      }),
    });
    expect(overlapRes.status).toBe(HttpStatus.CONFLICT);
  });
});
