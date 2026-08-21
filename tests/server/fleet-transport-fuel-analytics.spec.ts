import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  BranchType,
  EmploymentStatus,
  FleetFuelLogStatus,
  FleetTripStatus,
  UserStatus,
  branches,
  companies,
  companyModules,
  employees,
  fleetFuelLogs,
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

type FuelAnalyticsResponse = {
  summary: {
    tripsAnalyzed: number;
    anomalyCount: number;
    totalExpectedLiters: number;
    totalActualLiters: number;
    totalVarianceLiters: number;
    totalFuelCostPsw: number;
    averageCostPerKm: number | null;
  };
  data: Array<{
    tripId: string;
    tripNo: string;
    benchmarkKmPerLiter: number;
    distanceKm: number;
    expectedLiters: number;
    actualLiters: number;
    varianceLiters: number;
    variancePct: number;
    fuelCostPsw: number;
    costPerKm: number | null;
    anomaly: boolean;
    approvedFuelLogCount: number;
  }>;
};

describe('Fleet fuel analytics (authenticated)', () => {
  let companyId = '';
  let branchId = '';
  let roleId = '';
  let actorUserId = '';
  let actorEmail = '';
  let driverJobTitleId = '';
  let driverEmployeeId = '';
  let vehicleWithBenchmarkId = '';
  let vehicleWithoutBenchmarkId = '';
  let accessToken = '';

  beforeAll(async () => {
    const now = Date.now();

    const [company] = await db
      .insert(companies)
      .values({
        name: `Fuel Analytics Test Company ${now}`,
        type: 'test',
        code: `FATC${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: companies.id });
    companyId = company!.id;

    const [branch] = await db
      .insert(branches)
      .values({
        companyId,
        name: `Fuel Analytics Branch ${now}`,
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
        name: `Fuel Analytics Role ${now}`,
        createdBy: createId(),
        isDeleted: false,
      })
      .returning({ id: roles.id });
    roleId = role!.id;

    await db.insert(rolePermissions).values({
      companyId,
      roleId,
      permission: PermissionKeys.CanReadFleetFuelAnalytics,
    });

    actorEmail = `fuel-actor-${now}@example.com`;
    const [actor] = await db
      .insert(users)
      .values({
        fullname: `Fuel Actor ${now}`,
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
        code: `DRV-ANA-${now}`,
        createdBy: actorUserId,
      })
      .returning({ id: jobTitles.id });
    driverJobTitleId = driverJobTitle!.id;

    const [driver] = await db
      .insert(employees)
      .values({
        companyId,
        employeeNumber: `DRV-ANA-${now}`,
        firstName: 'Fuel',
        lastName: 'Driver',
        displayName: 'Fuel Driver',
        telephone: `+233${Math.floor(Math.random() * 1_000_000_000)}`,
        hireDate: new Date(),
        employmentStatus: EmploymentStatus.ACTIVE,
        branchId,
        jobTitleId: driverJobTitleId,
        createdBy: actorUserId,
      })
      .returning({ id: employees.id });
    driverEmployeeId = driver!.id;

    const [vehicleWithBenchmark] = await db
      .insert(fleetVehicles)
      .values({
        companyId,
        branchId,
        plateNumber: `GT-BENCH-${now}`,
        model: 'Benchmark Van',
        expectedKmPerLiter: 5,
        assignedDriverUserId: null,
        isActive: true,
        createdBy: actorUserId,
      })
      .returning({ id: fleetVehicles.id });
    vehicleWithBenchmarkId = vehicleWithBenchmark!.id;

    const [vehicleWithoutBenchmark] = await db
      .insert(fleetVehicles)
      .values({
        companyId,
        branchId,
        plateNumber: `GT-DEF-${now}`,
        model: 'Default Van',
        expectedKmPerLiter: null,
        assignedDriverUserId: null,
        isActive: true,
        createdBy: actorUserId,
      })
      .returning({ id: fleetVehicles.id });
    vehicleWithoutBenchmarkId = vehicleWithoutBenchmark!.id;

    const tripOneStartedAt = new Date('2026-01-10T08:00:00.000Z');
    const tripOneEndedAt = new Date('2026-01-10T10:00:00.000Z');
    const tripTwoStartedAt = new Date('2026-01-11T08:00:00.000Z');
    const tripTwoEndedAt = new Date('2026-01-11T09:00:00.000Z');

    await db.insert(fleetTrips).values([
      {
        companyId,
        branchId,
        tripNo: `TRIP-ANA-1-${now}`,
        vehicleId: vehicleWithBenchmarkId,
        driverEmployeeId,
        plannedStartAt: tripOneStartedAt,
        plannedEndAt: tripOneEndedAt,
        startedAt: tripOneStartedAt,
        endedAt: tripOneEndedAt,
        startOdometerKm: 100,
        endOdometerKm: 200,
        status: FleetTripStatus.COMPLETED,
        note: 'Trip one for analytics',
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
      {
        companyId,
        branchId,
        tripNo: `TRIP-ANA-2-${now}`,
        vehicleId: vehicleWithoutBenchmarkId,
        driverEmployeeId,
        plannedStartAt: tripTwoStartedAt,
        plannedEndAt: tripTwoEndedAt,
        startedAt: tripTwoStartedAt,
        endedAt: tripTwoEndedAt,
        startOdometerKm: 300,
        endOdometerKm: 340,
        status: FleetTripStatus.COMPLETED,
        note: 'Trip two for analytics',
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
    ]);

    await db.insert(fleetFuelLogs).values([
      {
        companyId,
        branchId,
        vehicleId: vehicleWithBenchmarkId,
        logNo: `FLOG-ANA-1-${now}`,
        liters: 30,
        fuelCostPsw: 600,
        status: FleetFuelLogStatus.APPROVED,
        loggedByUserId: actorUserId,
        approvedByUserId: actorUserId,
        approvedAt: new Date('2026-01-10T09:00:00.000Z'),
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
      },
      {
        companyId,
        branchId,
        vehicleId: vehicleWithBenchmarkId,
        logNo: `FLOG-ANA-2-${now}`,
        liters: 5,
        fuelCostPsw: 100,
        status: FleetFuelLogStatus.SUBMITTED,
        loggedByUserId: actorUserId,
        createdAt: new Date('2026-01-10T09:30:00.000Z'),
      },
      {
        companyId,
        branchId,
        vehicleId: vehicleWithoutBenchmarkId,
        logNo: `FLOG-ANA-3-${now}`,
        liters: 8,
        fuelCostPsw: 160,
        status: FleetFuelLogStatus.APPROVED,
        loggedByUserId: actorUserId,
        approvedByUserId: actorUserId,
        approvedAt: new Date('2026-01-11T08:30:00.000Z'),
        createdAt: new Date('2026-01-11T08:30:00.000Z'),
      },
    ]);

    accessToken = await createTestAccessToken({
      userId: actorUserId,
      email: actorEmail,
      permissions: [PermissionKeys.CanReadFleetFuelAnalytics],
      roleId,
      companyId,
      branchId,
      branchType: BranchType.AGENCY,
    });
  });

  afterAll(async () => {
    if (!companyId) return;

    await db.delete(fleetFuelLogs).where(eq(fleetFuelLogs.companyId, companyId));
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

  test('computes expected vs actual liters and anomaly flags', async () => {
    const res = await http(
      'GET',
      '/v1/fleet-transport/fuel-analytics?expectedOveruseThresholdPct=20&defaultExpectedKmPerLiter=4',
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(res.status).toBe(HttpStatus.OK);
    const payload = await json<FuelAnalyticsResponse>(res);

    expect(payload.summary.tripsAnalyzed).toBe(2);
    expect(payload.summary.anomalyCount).toBe(1);
    expect(payload.summary.totalExpectedLiters).toBeCloseTo(30, 6);
    expect(payload.summary.totalActualLiters).toBeCloseTo(38, 6);
    expect(payload.summary.totalVarianceLiters).toBeCloseTo(8, 6);
    expect(payload.summary.totalFuelCostPsw).toBe(760);
    expect(payload.summary.averageCostPerKm).toBeCloseTo(760 / 140, 6);

    const byTripNo = new Map(payload.data.map((row) => [row.tripNo, row]));
    const tripOne = [...byTripNo.values()].find((row) => row.distanceKm === 100);
    const tripTwo = [...byTripNo.values()].find((row) => row.distanceKm === 40);

    expect(tripOne).toBeDefined();
    expect(tripTwo).toBeDefined();

    expect(tripOne!.benchmarkKmPerLiter).toBe(5);
    expect(tripOne!.expectedLiters).toBeCloseTo(20, 6);
    expect(tripOne!.actualLiters).toBeCloseTo(30, 6);
    expect(tripOne!.varianceLiters).toBeCloseTo(10, 6);
    expect(tripOne!.variancePct).toBeCloseTo(50, 6);
    expect(tripOne!.anomaly).toBe(true);
    expect(tripOne!.approvedFuelLogCount).toBe(1);
    expect(tripOne!.costPerKm).toBeCloseTo(6, 6);

    expect(tripTwo!.benchmarkKmPerLiter).toBe(4);
    expect(tripTwo!.expectedLiters).toBeCloseTo(10, 6);
    expect(tripTwo!.actualLiters).toBeCloseTo(8, 6);
    expect(tripTwo!.varianceLiters).toBeCloseTo(-2, 6);
    expect(tripTwo!.variancePct).toBeCloseTo(-20, 6);
    expect(tripTwo!.anomaly).toBe(false);
    expect(tripTwo!.approvedFuelLogCount).toBe(1);
    expect(tripTwo!.costPerKm).toBeCloseTo(4, 6);
  });
});
