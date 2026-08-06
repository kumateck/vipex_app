import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '@/db/config';
import {
  EmploymentStatus,
  FleetFuelLogStatus,
  FleetMaintenanceWorkOrderStatus,
  FleetTripStatus,
  UserStatus,
  branches,
  customers,
  fleetDriverComplianceRecords,
  fleetMaintenancePlans,
  fleetMaintenanceWorkOrders,
  employees,
  fleetFuelLogs,
  fleetRoutePlans,
  fleetRoutePlanStops,
  auditLogs,
  fleetComplianceIncidents,
  fleetPolicyAcknowledgments,
  fleetMaintenanceParts,
  fleetMaintenancePartMovements,
  fleetTripCrewAssignments,
  fleetTripEvents,
  fleetTripLoadMatches,
  fleetTripStatusUpdates,
  fleetTripTelemetryPoints,
  fleetShiftRosters,
  fleetVehicleDocuments,
  fleetVehicleDowntimeEvents,
  fleetTrips,
  fleetVehicles,
  jobTitles,
  notificationDispatches,
  procurementDemands,
  procurementGoodsReceiptItems,
  procurementGoodsReceipts,
  procurementPurchaseOrderItems,
  procurementPurchaseOrders,
  users,
  parcels,
} from '@/db/schemas';

export type ListFleetVehiclesParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  isActive?: boolean | null;
};

export type ListFleetFuelLogsParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  status?: number | null;
  vehicleId?: string | null;
  pendingOnly?: boolean | null;
};

export type ListFleetTripsParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  status?: number | null;
  vehicleId?: string | null;
  driverEmployeeId?: string | null;
};

export type ListFleetRoutePlansParams = {
  companyId: string;
  isActive?: boolean | null;
  branchId?: string | null;
};

export type ListFleetShiftRostersParams = {
  companyId: string;
  branchId?: string | null;
  employeeId?: string | null;
  vehicleId?: string | null;
  status?: number | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit: number;
  offset: number;
};

export type ListFleetMaintenancePlansParams = {
  companyId: string;
  vehicleId?: string | null;
  isActive?: boolean | null;
};

export type ListFleetMaintenanceWorkOrdersParams = {
  companyId: string;
  vehicleId?: string | null;
  status?: number | null;
};

export type ListFleetDowntimeEventsParams = {
  companyId: string;
  vehicleId?: string | null;
  openOnly?: boolean | null;
};

export type ListFleetFuelAnalyticsTripsParams = {
  companyId: string;
  vehicleId?: string | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit: number;
};

export type ListFleetComplianceDashboardAlertsParams = {
  companyId: string;
  dueOnOrBefore: Date;
  limit: number;
  branchId?: string | null;
};

export type ListFleetComplianceIncidentsParams = {
  companyId: string;
  incidentType?: number | null;
  severity?: number | null;
  caseStatus?: 'open' | 'resolved' | null;
  employeeId?: string | null;
  vehicleId?: string | null;
  limit: number;
  offset: number;
};

export type ListFleetPolicyAcknowledgmentsParams = {
  companyId: string;
  policyCode?: string | null;
  employeeId?: string | null;
  userId?: string | null;
  limit: number;
  offset: number;
};

export type ListFleetMaintenancePartsParams = {
  companyId: string;
  branchId?: string | null;
  isActive?: boolean | null;
  search?: string | null;
  limit: number;
  offset: number;
};

export type ListFleetMaintenancePartMovementsParams = {
  companyId: string;
  partId: string;
  limit: number;
  offset: number;
};

export async function listFleetVehiclesRepo(params: ListFleetVehiclesParams) {
  const where = [eq(fleetVehicles.companyId, params.companyId)];

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(or(ilike(fleetVehicles.plateNumber, q), ilike(fleetVehicles.model, q))!);
  }
  if (typeof params.isActive === 'boolean') {
    where.push(eq(fleetVehicles.isActive, params.isActive));
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(fleetVehicles)
    .where(and(...where));

  const rows = await db
    .select({
      id: fleetVehicles.id,
      branchId: fleetVehicles.branchId,
      plateNumber: fleetVehicles.plateNumber,
      model: fleetVehicles.model,
      year: fleetVehicles.year,
      vin: fleetVehicles.vin,
      ownershipType: fleetVehicles.ownershipType,
      lessorName: fleetVehicles.lessorName,
      leaseStartAt: fleetVehicles.leaseStartAt,
      leaseEndAt: fleetVehicles.leaseEndAt,
      fuelType: fleetVehicles.fuelType,
      expectedKmPerLiter: fleetVehicles.expectedKmPerLiter,
      tankCapacityLiters: fleetVehicles.tankCapacityLiters,
      payloadCapacityKg: fleetVehicles.payloadCapacityKg,
      cargoCapacityCbm: fleetVehicles.cargoCapacityCbm,
      lifecycleStatus: fleetVehicles.lifecycleStatus,
      insuranceExpiryAt: fleetVehicles.insuranceExpiryAt,
      roadworthyExpiryAt: fleetVehicles.roadworthyExpiryAt,
      assignedDriverUserId: fleetVehicles.assignedDriverUserId,
      assignedDriverName: users.fullname,
      isActive: fleetVehicles.isActive,
      createdAt: fleetVehicles.createdAt,
      updatedAt: fleetVehicles.updatedAt,
    })
    .from(fleetVehicles)
    .leftJoin(users, eq(users.id, fleetVehicles.assignedDriverUserId))
    .where(and(...where))
    .orderBy(asc(fleetVehicles.plateNumber), asc(fleetVehicles.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function listFleetVehicleOptionsRepo(params: {
  companyId: string;
  search?: string | null;
  isActive?: boolean | null;
}) {
  const where = [eq(fleetVehicles.companyId, params.companyId)];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(or(ilike(fleetVehicles.plateNumber, q), ilike(fleetVehicles.model, q))!);
  }
  if (typeof params.isActive === 'boolean') {
    where.push(eq(fleetVehicles.isActive, params.isActive));
  }

  return db
    .select({
      id: fleetVehicles.id,
      plateNumber: fleetVehicles.plateNumber,
      model: fleetVehicles.model,
      isActive: fleetVehicles.isActive,
    })
    .from(fleetVehicles)
    .where(and(...where))
    .orderBy(asc(fleetVehicles.plateNumber), asc(fleetVehicles.id));
}

export async function createFleetVehicleRepo(values: typeof fleetVehicles.$inferInsert) {
  const [row] = await db.insert(fleetVehicles).values(values).returning({ id: fleetVehicles.id });
  return row;
}

export async function updateFleetVehicleRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof fleetVehicles.$inferInsert>,
) {
  const [row] = await db
    .update(fleetVehicles)
    .set(patch)
    .where(and(eq(fleetVehicles.id, id), eq(fleetVehicles.companyId, companyId)))
    .returning({ id: fleetVehicles.id });
  return row ?? null;
}

export async function findFleetVehicleByPlateRepo(companyId: string, plateNumber: string) {
  const [row] = await db
    .select({ id: fleetVehicles.id })
    .from(fleetVehicles)
    .where(
      and(eq(fleetVehicles.companyId, companyId), ilike(fleetVehicles.plateNumber, plateNumber)),
    )
    .limit(1);
  return row ?? null;
}

export async function getFleetVehicleByIdRepo(companyId: string, id: string) {
  const [row] = await db
    .select({
      id: fleetVehicles.id,
      companyId: fleetVehicles.companyId,
      branchId: fleetVehicles.branchId,
      plateNumber: fleetVehicles.plateNumber,
      model: fleetVehicles.model,
      year: fleetVehicles.year,
      vin: fleetVehicles.vin,
      ownershipType: fleetVehicles.ownershipType,
      lessorName: fleetVehicles.lessorName,
      leaseStartAt: fleetVehicles.leaseStartAt,
      leaseEndAt: fleetVehicles.leaseEndAt,
      fuelType: fleetVehicles.fuelType,
      expectedKmPerLiter: fleetVehicles.expectedKmPerLiter,
      tankCapacityLiters: fleetVehicles.tankCapacityLiters,
      payloadCapacityKg: fleetVehicles.payloadCapacityKg,
      cargoCapacityCbm: fleetVehicles.cargoCapacityCbm,
      lifecycleStatus: fleetVehicles.lifecycleStatus,
      insuranceExpiryAt: fleetVehicles.insuranceExpiryAt,
      roadworthyExpiryAt: fleetVehicles.roadworthyExpiryAt,
      assignedDriverUserId: fleetVehicles.assignedDriverUserId,
      assignedDriverName: users.fullname,
      isActive: fleetVehicles.isActive,
      createdAt: fleetVehicles.createdAt,
      updatedAt: fleetVehicles.updatedAt,
    })
    .from(fleetVehicles)
    .leftJoin(users, eq(users.id, fleetVehicles.assignedDriverUserId))
    .where(and(eq(fleetVehicles.id, id), eq(fleetVehicles.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function listFleetVehicleDocumentsRepo(companyId: string, vehicleId: string) {
  return db
    .select({
      id: fleetVehicleDocuments.id,
      vehicleId: fleetVehicleDocuments.vehicleId,
      documentType: fleetVehicleDocuments.documentType,
      documentNumber: fleetVehicleDocuments.documentNumber,
      issuer: fleetVehicleDocuments.issuer,
      issuedAt: fleetVehicleDocuments.issuedAt,
      expiresAt: fleetVehicleDocuments.expiresAt,
      fileUrl: fleetVehicleDocuments.fileUrl,
      note: fleetVehicleDocuments.note,
      createdAt: fleetVehicleDocuments.createdAt,
      updatedAt: fleetVehicleDocuments.updatedAt,
    })
    .from(fleetVehicleDocuments)
    .where(
      and(
        eq(fleetVehicleDocuments.companyId, companyId),
        eq(fleetVehicleDocuments.vehicleId, vehicleId),
      ),
    )
    .orderBy(desc(fleetVehicleDocuments.createdAt), desc(fleetVehicleDocuments.id));
}

export async function createFleetVehicleDocumentRepo(
  values: typeof fleetVehicleDocuments.$inferInsert,
) {
  const [row] = await db
    .insert(fleetVehicleDocuments)
    .values(values)
    .returning({ id: fleetVehicleDocuments.id });
  return row;
}

export async function listFleetVehicleComplianceAlertsRepo(input: {
  companyId: string;
  dueOnOrBefore: Date;
  limit: number;
}) {
  const [insuranceRows, roadworthyRows, documentRows] = await Promise.all([
    db
      .select({
        vehicleId: fleetVehicles.id,
        plateNumber: fleetVehicles.plateNumber,
        model: fleetVehicles.model,
        dueAt: fleetVehicles.insuranceExpiryAt,
        sourceRef: fleetVehicles.id,
      })
      .from(fleetVehicles)
      .where(
        and(
          eq(fleetVehicles.companyId, input.companyId),
          lte(fleetVehicles.insuranceExpiryAt, input.dueOnOrBefore),
        ),
      ),
    db
      .select({
        vehicleId: fleetVehicles.id,
        plateNumber: fleetVehicles.plateNumber,
        model: fleetVehicles.model,
        dueAt: fleetVehicles.roadworthyExpiryAt,
        sourceRef: fleetVehicles.id,
      })
      .from(fleetVehicles)
      .where(
        and(
          eq(fleetVehicles.companyId, input.companyId),
          lte(fleetVehicles.roadworthyExpiryAt, input.dueOnOrBefore),
        ),
      ),
    db
      .select({
        vehicleId: fleetVehicles.id,
        plateNumber: fleetVehicles.plateNumber,
        model: fleetVehicles.model,
        documentType: fleetVehicleDocuments.documentType,
        dueAt: fleetVehicleDocuments.expiresAt,
        sourceRef: fleetVehicleDocuments.id,
      })
      .from(fleetVehicleDocuments)
      .innerJoin(fleetVehicles, eq(fleetVehicles.id, fleetVehicleDocuments.vehicleId))
      .where(
        and(
          eq(fleetVehicleDocuments.companyId, input.companyId),
          lte(fleetVehicleDocuments.expiresAt, input.dueOnOrBefore),
        ),
      ),
  ]);

  const normalized = [
    ...insuranceRows.map((row) => ({
      vehicleId: row.vehicleId,
      plateNumber: row.plateNumber,
      model: row.model,
      alertType: 'insurance_expiry' as const,
      label: 'Insurance expiry',
      dueAt: row.dueAt,
      source: 'vehicle' as const,
      sourceRef: row.sourceRef,
    })),
    ...roadworthyRows.map((row) => ({
      vehicleId: row.vehicleId,
      plateNumber: row.plateNumber,
      model: row.model,
      alertType: 'roadworthy_expiry' as const,
      label: 'Roadworthy expiry',
      dueAt: row.dueAt,
      source: 'vehicle' as const,
      sourceRef: row.sourceRef,
    })),
    ...documentRows.map((row) => ({
      vehicleId: row.vehicleId,
      plateNumber: row.plateNumber,
      model: row.model,
      alertType: 'document_expiry' as const,
      label: `Document expiry: ${row.documentType}`,
      dueAt: row.dueAt,
      source: 'document' as const,
      sourceRef: row.sourceRef,
    })),
  ]
    .filter((row) => row.dueAt)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());

  return normalized.slice(0, input.limit);
}

export async function listFleetDriverOptionsRepo(input: {
  companyId: string;
  search?: string | null;
}) {
  const where = [
    eq(employees.companyId, input.companyId),
    eq(employees.isDeleted, false),
    eq(employees.employmentStatus, EmploymentStatus.ACTIVE),
  ];
  if (input.search?.trim()) {
    const q = `%${input.search.trim()}%`;
    where.push(
      or(
        ilike(employees.employeeNumber, q),
        ilike(employees.displayName, q),
        ilike(jobTitles.name, q),
      )!,
    );
  }

  const rows = await db
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      displayName: employees.displayName,
      jobTitleName: jobTitles.name,
      employmentStatus: employees.employmentStatus,
    })
    .from(employees)
    .leftJoin(jobTitles, eq(jobTitles.id, employees.jobTitleId))
    .where(and(...where))
    .orderBy(asc(employees.displayName), asc(employees.id));

  return rows.filter((row) => /\bdriver\b/i.test(row.jobTitleName ?? ''));
}

export async function listFleetDriverComplianceRecordsRepo(input: {
  companyId: string;
  employeeId: string;
}) {
  return db
    .select({
      id: fleetDriverComplianceRecords.id,
      employeeId: fleetDriverComplianceRecords.employeeId,
      complianceType: fleetDriverComplianceRecords.complianceType,
      documentNumber: fleetDriverComplianceRecords.documentNumber,
      issuer: fleetDriverComplianceRecords.issuer,
      issuedAt: fleetDriverComplianceRecords.issuedAt,
      expiresAt: fleetDriverComplianceRecords.expiresAt,
      fileUrl: fleetDriverComplianceRecords.fileUrl,
      note: fleetDriverComplianceRecords.note,
      createdAt: fleetDriverComplianceRecords.createdAt,
      updatedAt: fleetDriverComplianceRecords.updatedAt,
    })
    .from(fleetDriverComplianceRecords)
    .where(
      and(
        eq(fleetDriverComplianceRecords.companyId, input.companyId),
        eq(fleetDriverComplianceRecords.employeeId, input.employeeId),
      ),
    )
    .orderBy(desc(fleetDriverComplianceRecords.createdAt), desc(fleetDriverComplianceRecords.id));
}

export async function createFleetDriverComplianceRecordRepo(
  values: typeof fleetDriverComplianceRecords.$inferInsert,
) {
  const [row] = await db
    .insert(fleetDriverComplianceRecords)
    .values(values)
    .returning({ id: fleetDriverComplianceRecords.id });
  return row;
}

export async function listFleetDriverComplianceAlertsRepo(input: {
  companyId: string;
  dueOnOrBefore: Date;
  limit: number;
}) {
  const rows = await db
    .select({
      id: fleetDriverComplianceRecords.id,
      employeeId: fleetDriverComplianceRecords.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      complianceType: fleetDriverComplianceRecords.complianceType,
      dueAt: fleetDriverComplianceRecords.expiresAt,
    })
    .from(fleetDriverComplianceRecords)
    .innerJoin(employees, eq(employees.id, fleetDriverComplianceRecords.employeeId))
    .where(
      and(
        eq(fleetDriverComplianceRecords.companyId, input.companyId),
        lte(fleetDriverComplianceRecords.expiresAt, input.dueOnOrBefore),
      ),
    )
    .orderBy(asc(fleetDriverComplianceRecords.expiresAt), asc(fleetDriverComplianceRecords.id))
    .limit(input.limit);

  return rows.filter((row) => row.dueAt);
}

export async function listFleetComplianceDashboardAlertsRepo(
  params: ListFleetComplianceDashboardAlertsParams,
) {
  const insuranceWhere = [
    eq(fleetVehicles.companyId, params.companyId),
    lte(fleetVehicles.insuranceExpiryAt, params.dueOnOrBefore),
  ];
  const roadworthyWhere = [
    eq(fleetVehicles.companyId, params.companyId),
    lte(fleetVehicles.roadworthyExpiryAt, params.dueOnOrBefore),
  ];
  const documentWhere = [
    eq(fleetVehicleDocuments.companyId, params.companyId),
    lte(fleetVehicleDocuments.expiresAt, params.dueOnOrBefore),
  ];
  const driverWhere = [
    eq(fleetDriverComplianceRecords.companyId, params.companyId),
    lte(fleetDriverComplianceRecords.expiresAt, params.dueOnOrBefore),
  ];
  if (params.branchId) {
    insuranceWhere.push(eq(fleetVehicles.branchId, params.branchId));
    roadworthyWhere.push(eq(fleetVehicles.branchId, params.branchId));
    documentWhere.push(eq(fleetVehicles.branchId, params.branchId));
    driverWhere.push(eq(employees.branchId, params.branchId));
  }

  const [insuranceRows, roadworthyRows, documentRows, driverRows] = await Promise.all([
    db
      .select({
        id: fleetVehicles.id,
        branchId: fleetVehicles.branchId,
        branchName: branches.name,
        dueAt: fleetVehicles.insuranceExpiryAt,
        plateNumber: fleetVehicles.plateNumber,
        model: fleetVehicles.model,
      })
      .from(fleetVehicles)
      .leftJoin(branches, eq(branches.id, fleetVehicles.branchId))
      .where(and(...insuranceWhere)),
    db
      .select({
        id: fleetVehicles.id,
        branchId: fleetVehicles.branchId,
        branchName: branches.name,
        dueAt: fleetVehicles.roadworthyExpiryAt,
        plateNumber: fleetVehicles.plateNumber,
        model: fleetVehicles.model,
      })
      .from(fleetVehicles)
      .leftJoin(branches, eq(branches.id, fleetVehicles.branchId))
      .where(and(...roadworthyWhere)),
    db
      .select({
        id: fleetVehicleDocuments.id,
        branchId: fleetVehicles.branchId,
        branchName: branches.name,
        dueAt: fleetVehicleDocuments.expiresAt,
        plateNumber: fleetVehicles.plateNumber,
        model: fleetVehicles.model,
        documentType: fleetVehicleDocuments.documentType,
        vehicleId: fleetVehicles.id,
      })
      .from(fleetVehicleDocuments)
      .innerJoin(fleetVehicles, eq(fleetVehicles.id, fleetVehicleDocuments.vehicleId))
      .leftJoin(branches, eq(branches.id, fleetVehicles.branchId))
      .where(and(...documentWhere)),
    db
      .select({
        id: fleetDriverComplianceRecords.id,
        branchId: employees.branchId,
        branchName: branches.name,
        dueAt: fleetDriverComplianceRecords.expiresAt,
        employeeId: employees.id,
        employeeNumber: employees.employeeNumber,
        employeeName: employees.displayName,
        complianceType: fleetDriverComplianceRecords.complianceType,
      })
      .from(fleetDriverComplianceRecords)
      .innerJoin(employees, eq(employees.id, fleetDriverComplianceRecords.employeeId))
      .leftJoin(branches, eq(branches.id, employees.branchId))
      .where(and(...driverWhere)),
  ]);

  const normalized = [
    ...insuranceRows.map((row) => ({
      kind: 'vehicle' as const,
      alertType: 'insurance_expiry' as const,
      sourceRef: row.id,
      branchId: row.branchId,
      branchName: row.branchName,
      dueAt: row.dueAt,
      label: 'Insurance expiry',
      vehicleId: row.id,
      plateNumber: row.plateNumber,
      model: row.model,
      employeeId: null,
      employeeNumber: null,
      employeeName: null,
      complianceType: null,
    })),
    ...roadworthyRows.map((row) => ({
      kind: 'vehicle' as const,
      alertType: 'roadworthy_expiry' as const,
      sourceRef: row.id,
      branchId: row.branchId,
      branchName: row.branchName,
      dueAt: row.dueAt,
      label: 'Roadworthy expiry',
      vehicleId: row.id,
      plateNumber: row.plateNumber,
      model: row.model,
      employeeId: null,
      employeeNumber: null,
      employeeName: null,
      complianceType: null,
    })),
    ...documentRows.map((row) => ({
      kind: 'vehicle' as const,
      alertType: 'document_expiry' as const,
      sourceRef: row.id,
      branchId: row.branchId,
      branchName: row.branchName,
      dueAt: row.dueAt,
      label: `Document expiry: ${row.documentType}`,
      vehicleId: row.vehicleId,
      plateNumber: row.plateNumber,
      model: row.model,
      employeeId: null,
      employeeNumber: null,
      employeeName: null,
      complianceType: null,
    })),
    ...driverRows.map((row) => ({
      kind: 'driver' as const,
      alertType: 'driver_compliance_expiry' as const,
      sourceRef: row.id,
      branchId: row.branchId,
      branchName: row.branchName,
      dueAt: row.dueAt,
      label: 'Driver compliance expiry',
      vehicleId: null,
      plateNumber: null,
      model: null,
      employeeId: row.employeeId,
      employeeNumber: row.employeeNumber,
      employeeName: row.employeeName,
      complianceType: row.complianceType,
    })),
  ]
    .filter((row) => row.dueAt)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());

  return normalized.slice(0, params.limit);
}

export async function listFleetComplianceAlertRecipientUsersRepo(input: {
  companyId: string;
  limit: number;
}) {
  return db
    .select({
      id: users.id,
      fullname: users.fullname,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        eq(users.companyId, input.companyId),
        eq(users.status, UserStatus.ACTIVE),
        isNotNull(users.email),
      ),
    )
    .orderBy(asc(users.fullname), asc(users.id))
    .limit(input.limit);
}

export async function createFleetComplianceAlertDispatchRepo(
  values: typeof notificationDispatches.$inferInsert,
) {
  const [row] = await db
    .insert(notificationDispatches)
    .values(values)
    .returning({ id: notificationDispatches.id });
  return row;
}

export async function updateFleetComplianceAlertDispatchRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof notificationDispatches.$inferInsert>,
) {
  const [row] = await db
    .update(notificationDispatches)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(notificationDispatches.id, id), eq(notificationDispatches.companyId, companyId)))
    .returning({ id: notificationDispatches.id });
  return row ?? null;
}

export async function listFleetMaintenancePlansRepo(params: ListFleetMaintenancePlansParams) {
  const where = [eq(fleetMaintenancePlans.companyId, params.companyId)];
  if (params.vehicleId) where.push(eq(fleetMaintenancePlans.vehicleId, params.vehicleId));
  if (typeof params.isActive === 'boolean') {
    where.push(eq(fleetMaintenancePlans.isActive, params.isActive));
  }

  return db
    .select({
      id: fleetMaintenancePlans.id,
      vehicleId: fleetMaintenancePlans.vehicleId,
      vehiclePlateNumber: fleetVehicles.plateNumber,
      title: fleetMaintenancePlans.title,
      description: fleetMaintenancePlans.description,
      intervalUnit: fleetMaintenancePlans.intervalUnit,
      intervalValue: fleetMaintenancePlans.intervalValue,
      lastServiceAt: fleetMaintenancePlans.lastServiceAt,
      lastServiceOdometerKm: fleetMaintenancePlans.lastServiceOdometerKm,
      nextDueAt: fleetMaintenancePlans.nextDueAt,
      nextDueOdometerKm: fleetMaintenancePlans.nextDueOdometerKm,
      isActive: fleetMaintenancePlans.isActive,
      createdAt: fleetMaintenancePlans.createdAt,
      updatedAt: fleetMaintenancePlans.updatedAt,
    })
    .from(fleetMaintenancePlans)
    .leftJoin(fleetVehicles, eq(fleetVehicles.id, fleetMaintenancePlans.vehicleId))
    .where(and(...where))
    .orderBy(asc(fleetMaintenancePlans.nextDueAt), asc(fleetMaintenancePlans.id));
}

export async function createFleetMaintenancePlanRepo(
  values: typeof fleetMaintenancePlans.$inferInsert,
) {
  const [row] = await db
    .insert(fleetMaintenancePlans)
    .values(values)
    .returning({ id: fleetMaintenancePlans.id });
  return row;
}

export async function updateFleetMaintenancePlanRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof fleetMaintenancePlans.$inferInsert>,
) {
  const [row] = await db
    .update(fleetMaintenancePlans)
    .set(patch)
    .where(and(eq(fleetMaintenancePlans.id, id), eq(fleetMaintenancePlans.companyId, companyId)))
    .returning({ id: fleetMaintenancePlans.id });
  return row ?? null;
}

export async function getFleetMaintenancePlanByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: fleetMaintenancePlans.id,
      companyId: fleetMaintenancePlans.companyId,
      vehicleId: fleetMaintenancePlans.vehicleId,
      isActive: fleetMaintenancePlans.isActive,
    })
    .from(fleetMaintenancePlans)
    .where(and(eq(fleetMaintenancePlans.id, id), eq(fleetMaintenancePlans.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function listFleetMaintenanceWorkOrdersRepo(
  params: ListFleetMaintenanceWorkOrdersParams,
) {
  const where = [eq(fleetMaintenanceWorkOrders.companyId, params.companyId)];
  if (params.vehicleId) where.push(eq(fleetMaintenanceWorkOrders.vehicleId, params.vehicleId));
  if (typeof params.status === 'number')
    where.push(eq(fleetMaintenanceWorkOrders.status, params.status));

  return db
    .select({
      id: fleetMaintenanceWorkOrders.id,
      vehicleId: fleetMaintenanceWorkOrders.vehicleId,
      vehiclePlateNumber: fleetVehicles.plateNumber,
      planId: fleetMaintenanceWorkOrders.planId,
      workOrderNo: fleetMaintenanceWorkOrders.workOrderNo,
      title: fleetMaintenanceWorkOrders.title,
      description: fleetMaintenanceWorkOrders.description,
      openedAt: fleetMaintenanceWorkOrders.openedAt,
      startedAt: fleetMaintenanceWorkOrders.startedAt,
      completedAt: fleetMaintenanceWorkOrders.completedAt,
      startedOdometerKm: fleetMaintenanceWorkOrders.startedOdometerKm,
      completedOdometerKm: fleetMaintenanceWorkOrders.completedOdometerKm,
      estimatedCostPsw: fleetMaintenanceWorkOrders.estimatedCostPsw,
      actualCostPsw: fleetMaintenanceWorkOrders.actualCostPsw,
      status: fleetMaintenanceWorkOrders.status,
      createdAt: fleetMaintenanceWorkOrders.createdAt,
      updatedAt: fleetMaintenanceWorkOrders.updatedAt,
    })
    .from(fleetMaintenanceWorkOrders)
    .leftJoin(fleetVehicles, eq(fleetVehicles.id, fleetMaintenanceWorkOrders.vehicleId))
    .where(and(...where))
    .orderBy(desc(fleetMaintenanceWorkOrders.createdAt), desc(fleetMaintenanceWorkOrders.id));
}

export async function createFleetMaintenanceWorkOrderRepo(
  values: typeof fleetMaintenanceWorkOrders.$inferInsert,
) {
  const [row] = await db
    .insert(fleetMaintenanceWorkOrders)
    .values(values)
    .returning({ id: fleetMaintenanceWorkOrders.id });
  return row;
}

export async function updateFleetMaintenanceWorkOrderRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof fleetMaintenanceWorkOrders.$inferInsert>,
) {
  const [row] = await db
    .update(fleetMaintenanceWorkOrders)
    .set(patch)
    .where(
      and(
        eq(fleetMaintenanceWorkOrders.id, id),
        eq(fleetMaintenanceWorkOrders.companyId, companyId),
      ),
    )
    .returning({ id: fleetMaintenanceWorkOrders.id });
  return row ?? null;
}

export async function getFleetMaintenanceWorkOrderByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: fleetMaintenanceWorkOrders.id,
      companyId: fleetMaintenanceWorkOrders.companyId,
      vehicleId: fleetMaintenanceWorkOrders.vehicleId,
      status: fleetMaintenanceWorkOrders.status,
      startedAt: fleetMaintenanceWorkOrders.startedAt,
      completedAt: fleetMaintenanceWorkOrders.completedAt,
      startedOdometerKm: fleetMaintenanceWorkOrders.startedOdometerKm,
    })
    .from(fleetMaintenanceWorkOrders)
    .where(
      and(
        eq(fleetMaintenanceWorkOrders.id, id),
        eq(fleetMaintenanceWorkOrders.companyId, companyId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findOpenWorkOrderByVehicleRepo(companyId: string, vehicleId: string) {
  const [row] = await db
    .select({ id: fleetMaintenanceWorkOrders.id })
    .from(fleetMaintenanceWorkOrders)
    .where(
      and(
        eq(fleetMaintenanceWorkOrders.companyId, companyId),
        eq(fleetMaintenanceWorkOrders.vehicleId, vehicleId),
        or(
          eq(fleetMaintenanceWorkOrders.status, FleetMaintenanceWorkOrderStatus.OPEN),
          eq(fleetMaintenanceWorkOrders.status, FleetMaintenanceWorkOrderStatus.IN_PROGRESS),
        )!,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findOpenWorkOrderByPlanRepo(companyId: string, planId: string) {
  const [row] = await db
    .select({ id: fleetMaintenanceWorkOrders.id })
    .from(fleetMaintenanceWorkOrders)
    .where(
      and(
        eq(fleetMaintenanceWorkOrders.companyId, companyId),
        eq(fleetMaintenanceWorkOrders.planId, planId),
        or(
          eq(fleetMaintenanceWorkOrders.status, FleetMaintenanceWorkOrderStatus.OPEN),
          eq(fleetMaintenanceWorkOrders.status, FleetMaintenanceWorkOrderStatus.IN_PROGRESS),
        )!,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listFleetDowntimeEventsRepo(params: ListFleetDowntimeEventsParams) {
  const where = [eq(fleetVehicleDowntimeEvents.companyId, params.companyId)];
  if (params.vehicleId) where.push(eq(fleetVehicleDowntimeEvents.vehicleId, params.vehicleId));
  if (params.openOnly) where.push(isNull(fleetVehicleDowntimeEvents.endedAt));

  return db
    .select({
      id: fleetVehicleDowntimeEvents.id,
      vehicleId: fleetVehicleDowntimeEvents.vehicleId,
      vehiclePlateNumber: fleetVehicles.plateNumber,
      workOrderId: fleetVehicleDowntimeEvents.workOrderId,
      reason: fleetVehicleDowntimeEvents.reason,
      note: fleetVehicleDowntimeEvents.note,
      startedAt: fleetVehicleDowntimeEvents.startedAt,
      endedAt: fleetVehicleDowntimeEvents.endedAt,
      createdAt: fleetVehicleDowntimeEvents.createdAt,
      updatedAt: fleetVehicleDowntimeEvents.updatedAt,
    })
    .from(fleetVehicleDowntimeEvents)
    .leftJoin(fleetVehicles, eq(fleetVehicles.id, fleetVehicleDowntimeEvents.vehicleId))
    .where(and(...where))
    .orderBy(desc(fleetVehicleDowntimeEvents.startedAt), desc(fleetVehicleDowntimeEvents.id));
}

export async function createFleetDowntimeEventRepo(
  values: typeof fleetVehicleDowntimeEvents.$inferInsert,
) {
  const [row] = await db
    .insert(fleetVehicleDowntimeEvents)
    .values(values)
    .returning({ id: fleetVehicleDowntimeEvents.id });
  return row;
}

export async function closeFleetDowntimeEventRepo(input: {
  id: string;
  companyId: string;
  closedBy: string;
  endedAt: Date;
  note?: string | null;
}) {
  const [row] = await db
    .update(fleetVehicleDowntimeEvents)
    .set({
      endedAt: input.endedAt,
      closedBy: input.closedBy,
      note: input.note ?? undefined,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(fleetVehicleDowntimeEvents.id, input.id),
        eq(fleetVehicleDowntimeEvents.companyId, input.companyId),
      ),
    )
    .returning({ id: fleetVehicleDowntimeEvents.id });
  return row ?? null;
}

export async function updateFleetDowntimeEventRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof fleetVehicleDowntimeEvents.$inferInsert>,
) {
  const [row] = await db
    .update(fleetVehicleDowntimeEvents)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(fleetVehicleDowntimeEvents.id, id),
        eq(fleetVehicleDowntimeEvents.companyId, companyId),
      ),
    )
    .returning({ id: fleetVehicleDowntimeEvents.id });
  return row ?? null;
}

export async function getFleetDowntimeEventByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: fleetVehicleDowntimeEvents.id,
      vehicleId: fleetVehicleDowntimeEvents.vehicleId,
      reason: fleetVehicleDowntimeEvents.reason,
      note: fleetVehicleDowntimeEvents.note,
      startedAt: fleetVehicleDowntimeEvents.startedAt,
      endedAt: fleetVehicleDowntimeEvents.endedAt,
    })
    .from(fleetVehicleDowntimeEvents)
    .where(
      and(
        eq(fleetVehicleDowntimeEvents.id, id),
        eq(fleetVehicleDowntimeEvents.companyId, companyId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getEmployeeByIdRepo(companyId: string, id: string) {
  const [row] = await db
    .select({
      id: employees.id,
      companyId: employees.companyId,
      displayName: employees.displayName,
      isDeleted: employees.isDeleted,
      employmentStatus: employees.employmentStatus,
      jobTitleName: jobTitles.name,
    })
    .from(employees)
    .leftJoin(jobTitles, eq(jobTitles.id, employees.jobTitleId))
    .where(and(eq(employees.id, id), eq(employees.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function findActiveFleetTripByVehicleRepo(companyId: string, vehicleId: string) {
  const [row] = await db
    .select({ id: fleetTrips.id })
    .from(fleetTrips)
    .where(
      and(
        eq(fleetTrips.companyId, companyId),
        eq(fleetTrips.vehicleId, vehicleId),
        eq(fleetTrips.status, FleetTripStatus.IN_PROGRESS),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findActiveFleetTripByDriverRepo(companyId: string, driverEmployeeId: string) {
  const [row] = await db
    .select({ id: fleetTrips.id })
    .from(fleetTrips)
    .where(
      and(
        eq(fleetTrips.companyId, companyId),
        eq(fleetTrips.driverEmployeeId, driverEmployeeId),
        eq(fleetTrips.status, FleetTripStatus.IN_PROGRESS),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listFleetRoutePlansRepo(params: ListFleetRoutePlansParams) {
  const where = [eq(fleetRoutePlans.companyId, params.companyId)];
  if (typeof params.isActive === 'boolean') {
    where.push(eq(fleetRoutePlans.isActive, params.isActive));
  }
  if (params.branchId) {
    where.push(eq(fleetRoutePlans.branchId, params.branchId));
  }

  return db
    .select({
      id: fleetRoutePlans.id,
      branchId: fleetRoutePlans.branchId,
      name: fleetRoutePlans.name,
      code: fleetRoutePlans.code,
      originLabel: fleetRoutePlans.originLabel,
      destinationLabel: fleetRoutePlans.destinationLabel,
      distanceKm: fleetRoutePlans.distanceKm,
      estimatedDurationMin: fleetRoutePlans.estimatedDurationMin,
      isActive: fleetRoutePlans.isActive,
      createdAt: fleetRoutePlans.createdAt,
      updatedAt: fleetRoutePlans.updatedAt,
    })
    .from(fleetRoutePlans)
    .where(and(...where))
    .orderBy(asc(fleetRoutePlans.name), asc(fleetRoutePlans.id));
}

export async function createFleetRoutePlanRepo(values: typeof fleetRoutePlans.$inferInsert) {
  const [row] = await db
    .insert(fleetRoutePlans)
    .values(values)
    .returning({ id: fleetRoutePlans.id });
  return row;
}

export async function getFleetRoutePlanByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: fleetRoutePlans.id,
      branchId: fleetRoutePlans.branchId,
      name: fleetRoutePlans.name,
      code: fleetRoutePlans.code,
      originLabel: fleetRoutePlans.originLabel,
      destinationLabel: fleetRoutePlans.destinationLabel,
      distanceKm: fleetRoutePlans.distanceKm,
      estimatedDurationMin: fleetRoutePlans.estimatedDurationMin,
      isActive: fleetRoutePlans.isActive,
      createdAt: fleetRoutePlans.createdAt,
      updatedAt: fleetRoutePlans.updatedAt,
    })
    .from(fleetRoutePlans)
    .where(and(eq(fleetRoutePlans.id, id), eq(fleetRoutePlans.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function replaceFleetRoutePlanStopsRepo(input: {
  companyId: string;
  routePlanId: string;
  stops: Array<{
    sequenceNo: number;
    label: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    plannedArrivalOffsetMin?: number | null;
    note?: string | null;
  }>;
}) {
  return db.transaction(async (tx) => {
    await tx
      .delete(fleetRoutePlanStops)
      .where(
        and(
          eq(fleetRoutePlanStops.companyId, input.companyId),
          eq(fleetRoutePlanStops.routePlanId, input.routePlanId),
        ),
      );

    if (!input.stops.length) return;

    await tx.insert(fleetRoutePlanStops).values(
      input.stops.map((stop) => ({
        companyId: input.companyId,
        routePlanId: input.routePlanId,
        sequenceNo: stop.sequenceNo,
        label: stop.label,
        address: stop.address ?? null,
        latitude: stop.latitude ?? null,
        longitude: stop.longitude ?? null,
        plannedArrivalOffsetMin: stop.plannedArrivalOffsetMin ?? null,
        note: stop.note ?? null,
      })),
    );
  });
}

export async function listFleetRoutePlanStopsRepo(companyId: string, routePlanId: string) {
  return db
    .select({
      id: fleetRoutePlanStops.id,
      routePlanId: fleetRoutePlanStops.routePlanId,
      sequenceNo: fleetRoutePlanStops.sequenceNo,
      label: fleetRoutePlanStops.label,
      address: fleetRoutePlanStops.address,
      latitude: fleetRoutePlanStops.latitude,
      longitude: fleetRoutePlanStops.longitude,
      plannedArrivalOffsetMin: fleetRoutePlanStops.plannedArrivalOffsetMin,
      note: fleetRoutePlanStops.note,
      createdAt: fleetRoutePlanStops.createdAt,
      updatedAt: fleetRoutePlanStops.updatedAt,
    })
    .from(fleetRoutePlanStops)
    .where(
      and(
        eq(fleetRoutePlanStops.companyId, companyId),
        eq(fleetRoutePlanStops.routePlanId, routePlanId),
      ),
    )
    .orderBy(asc(fleetRoutePlanStops.sequenceNo), asc(fleetRoutePlanStops.id));
}

export async function listFleetTripsRepo(params: ListFleetTripsParams) {
  const where = [eq(fleetTrips.companyId, params.companyId)];

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(fleetTrips.tripNo, q),
        ilike(fleetVehicles.plateNumber, q),
        ilike(employees.displayName, q),
      )!,
    );
  }
  if (typeof params.status === 'number') {
    where.push(eq(fleetTrips.status, params.status));
  }
  if (params.vehicleId) {
    where.push(eq(fleetTrips.vehicleId, params.vehicleId));
  }
  if (params.driverEmployeeId) {
    where.push(eq(fleetTrips.driverEmployeeId, params.driverEmployeeId));
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(fleetTrips)
    .leftJoin(fleetVehicles, eq(fleetVehicles.id, fleetTrips.vehicleId))
    .leftJoin(employees, eq(employees.id, fleetTrips.driverEmployeeId))
    .where(and(...where));

  const rows = await db
    .select({
      id: fleetTrips.id,
      tripNo: fleetTrips.tripNo,
      branchId: fleetTrips.branchId,
      branchName: branches.name,
      vehicleId: fleetTrips.vehicleId,
      vehiclePlateNumber: fleetVehicles.plateNumber,
      routePlanId: fleetTrips.routePlanId,
      routePlanName: fleetRoutePlans.name,
      driverEmployeeId: fleetTrips.driverEmployeeId,
      driverEmployeeName: employees.displayName,
      plannedStartAt: fleetTrips.plannedStartAt,
      plannedEndAt: fleetTrips.plannedEndAt,
      startedAt: fleetTrips.startedAt,
      endedAt: fleetTrips.endedAt,
      startOdometerKm: fleetTrips.startOdometerKm,
      endOdometerKm: fleetTrips.endOdometerKm,
      status: fleetTrips.status,
      note: fleetTrips.note,
      createdAt: fleetTrips.createdAt,
      updatedAt: fleetTrips.updatedAt,
    })
    .from(fleetTrips)
    .leftJoin(fleetVehicles, eq(fleetVehicles.id, fleetTrips.vehicleId))
    .leftJoin(branches, eq(branches.id, fleetTrips.branchId))
    .leftJoin(fleetRoutePlans, eq(fleetRoutePlans.id, fleetTrips.routePlanId))
    .leftJoin(employees, eq(employees.id, fleetTrips.driverEmployeeId))
    .where(and(...where))
    .orderBy(desc(fleetTrips.createdAt), desc(fleetTrips.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function createFleetTripRepo(values: typeof fleetTrips.$inferInsert) {
  const [row] = await db.insert(fleetTrips).values(values).returning({ id: fleetTrips.id });
  return row;
}

export async function getFleetTripByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: fleetTrips.id,
      tripNo: fleetTrips.tripNo,
      branchId: fleetTrips.branchId,
      vehicleId: fleetTrips.vehicleId,
      vehiclePlateNumber: fleetVehicles.plateNumber,
      routePlanId: fleetTrips.routePlanId,
      routePlanName: fleetRoutePlans.name,
      driverEmployeeId: fleetTrips.driverEmployeeId,
      driverEmployeeName: employees.displayName,
      plannedStartAt: fleetTrips.plannedStartAt,
      plannedEndAt: fleetTrips.plannedEndAt,
      startedAt: fleetTrips.startedAt,
      endedAt: fleetTrips.endedAt,
      startOdometerKm: fleetTrips.startOdometerKm,
      endOdometerKm: fleetTrips.endOdometerKm,
      status: fleetTrips.status,
      note: fleetTrips.note,
      createdAt: fleetTrips.createdAt,
      updatedAt: fleetTrips.updatedAt,
    })
    .from(fleetTrips)
    .leftJoin(fleetVehicles, eq(fleetVehicles.id, fleetTrips.vehicleId))
    .leftJoin(fleetRoutePlans, eq(fleetRoutePlans.id, fleetTrips.routePlanId))
    .leftJoin(employees, eq(employees.id, fleetTrips.driverEmployeeId))
    .where(and(eq(fleetTrips.id, id), eq(fleetTrips.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function updateFleetTripRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof fleetTrips.$inferInsert>,
) {
  const [row] = await db
    .update(fleetTrips)
    .set(patch)
    .where(and(eq(fleetTrips.id, id), eq(fleetTrips.companyId, companyId)))
    .returning({ id: fleetTrips.id });
  return row ?? null;
}

export async function replaceFleetTripCrewRepo(input: {
  companyId: string;
  tripId: string;
  actorUserId: string;
  crewEmployeeIds: string[];
}) {
  return db.transaction(async (tx) => {
    await tx
      .delete(fleetTripCrewAssignments)
      .where(
        and(
          eq(fleetTripCrewAssignments.companyId, input.companyId),
          eq(fleetTripCrewAssignments.tripId, input.tripId),
        ),
      );

    if (!input.crewEmployeeIds.length) return;

    await tx.insert(fleetTripCrewAssignments).values(
      input.crewEmployeeIds.map((employeeId) => ({
        companyId: input.companyId,
        tripId: input.tripId,
        employeeId,
        role: 'crew',
        assignedBy: input.actorUserId,
      })),
    );
  });
}

export async function listFleetTripCrewRepo(companyId: string, tripId: string) {
  return db
    .select({
      employeeId: fleetTripCrewAssignments.employeeId,
      employeeName: employees.displayName,
      role: fleetTripCrewAssignments.role,
      assignedAt: fleetTripCrewAssignments.createdAt,
    })
    .from(fleetTripCrewAssignments)
    .innerJoin(employees, eq(employees.id, fleetTripCrewAssignments.employeeId))
    .where(
      and(
        eq(fleetTripCrewAssignments.companyId, companyId),
        eq(fleetTripCrewAssignments.tripId, tripId),
      ),
    )
    .orderBy(asc(employees.displayName), asc(fleetTripCrewAssignments.id));
}

export async function createFleetTripEventRepo(input: {
  companyId: string;
  tripId: string;
  eventType: number;
  occurredAt: Date;
  odometerKm?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  locationLabel?: string | null;
  note?: string | null;
  createdBy: string;
}) {
  const [row] = await db
    .insert(fleetTripEvents)
    .values({
      companyId: input.companyId,
      tripId: input.tripId,
      eventType: input.eventType,
      occurredAt: input.occurredAt,
      odometerKm: input.odometerKm ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      locationLabel: input.locationLabel ?? null,
      note: input.note ?? null,
      createdBy: input.createdBy,
    })
    .returning({ id: fleetTripEvents.id });
  return row ?? null;
}

export async function listFleetTripEventsRepo(companyId: string, tripId: string) {
  return db
    .select({
      id: fleetTripEvents.id,
      tripId: fleetTripEvents.tripId,
      eventType: fleetTripEvents.eventType,
      occurredAt: fleetTripEvents.occurredAt,
      odometerKm: fleetTripEvents.odometerKm,
      latitude: fleetTripEvents.latitude,
      longitude: fleetTripEvents.longitude,
      locationLabel: fleetTripEvents.locationLabel,
      note: fleetTripEvents.note,
      createdBy: fleetTripEvents.createdBy,
      createdAt: fleetTripEvents.createdAt,
      createdByName: users.fullname,
    })
    .from(fleetTripEvents)
    .leftJoin(users, eq(users.id, fleetTripEvents.createdBy))
    .where(and(eq(fleetTripEvents.companyId, companyId), eq(fleetTripEvents.tripId, tripId)))
    .orderBy(desc(fleetTripEvents.occurredAt), desc(fleetTripEvents.id));
}

export async function findFleetParcelByIdRepo(companyId: string, parcelId: string) {
  const [row] = await db
    .select({
      id: parcels.id,
      sourceId: parcels.sourceId,
      destinationId: parcels.destinationId,
      status: parcels.status,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      isDeleted: parcels.isDeleted,
    })
    .from(parcels)
    .where(and(eq(parcels.companyId, companyId), eq(parcels.id, parcelId)));
  return row ?? null;
}

export async function findActiveFleetLoadMatchForParcelRepo(companyId: string, parcelId: string) {
  const [row] = await db
    .select({
      id: fleetTripLoadMatches.id,
      tripId: fleetTripLoadMatches.tripId,
      status: fleetTripLoadMatches.status,
    })
    .from(fleetTripLoadMatches)
    .where(
      and(
        eq(fleetTripLoadMatches.companyId, companyId),
        eq(fleetTripLoadMatches.parcelId, parcelId),
        or(eq(fleetTripLoadMatches.status, 0), eq(fleetTripLoadMatches.status, 1))!,
      ),
    )
    .orderBy(desc(fleetTripLoadMatches.updatedAt), desc(fleetTripLoadMatches.id))
    .limit(1);
  return row ?? null;
}

export async function createFleetTripLoadMatchRepo(input: {
  companyId: string;
  tripId: string;
  parcelId: string;
  status: number;
  matchedBy: string;
  note?: string | null;
}) {
  const [row] = await db
    .insert(fleetTripLoadMatches)
    .values({
      companyId: input.companyId,
      tripId: input.tripId,
      parcelId: input.parcelId,
      status: input.status,
      matchedBy: input.matchedBy,
      matchedAt: new Date(),
      note: input.note ?? null,
    })
    .returning({ id: fleetTripLoadMatches.id });
  return row ?? null;
}

export async function listFleetTripLoadMatchesRepo(companyId: string, tripId: string) {
  return db
    .select({
      id: fleetTripLoadMatches.id,
      tripId: fleetTripLoadMatches.tripId,
      parcelId: fleetTripLoadMatches.parcelId,
      status: fleetTripLoadMatches.status,
      matchedBy: fleetTripLoadMatches.matchedBy,
      matchedAt: fleetTripLoadMatches.matchedAt,
      loadedAt: fleetTripLoadMatches.loadedAt,
      unloadedAt: fleetTripLoadMatches.unloadedAt,
      note: fleetTripLoadMatches.note,
      createdAt: fleetTripLoadMatches.createdAt,
      updatedAt: fleetTripLoadMatches.updatedAt,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      sourceId: parcels.sourceId,
      destinationId: parcels.destinationId,
    })
    .from(fleetTripLoadMatches)
    .leftJoin(parcels, eq(parcels.id, fleetTripLoadMatches.parcelId))
    .where(
      and(eq(fleetTripLoadMatches.companyId, companyId), eq(fleetTripLoadMatches.tripId, tripId)),
    )
    .orderBy(desc(fleetTripLoadMatches.createdAt), desc(fleetTripLoadMatches.id));
}

export async function listFleetDispatchLoadCandidatesRepo(input: {
  companyId: string;
  search?: string | null;
  limit: number;
}) {
  const q = input.search?.trim() ? `%${input.search.trim()}%` : null;
  const rows = await db.execute(sql<{
    parcel_id: string;
    source_id: string | null;
    destination_id: string | null;
    parcel_status: number;
    booking_code: string;
    tracking_code: string;
    active_trip_id: string | null;
    active_load_status: number | null;
  }>`
    with active_matches as (
      select
        m.parcel_id,
        m.trip_id,
        m.status,
        row_number() over (partition by m.parcel_id order by m.updated_at desc, m.id desc) as rn
      from fleet_trip_load_matches m
      where m.company_id = ${input.companyId}
        and m.status in (0, 1)
    )
    select
      p.id as parcel_id,
      p.source_id,
      p.destination_id,
      p.status as parcel_status,
      p.booking_code,
      p.tracking_code,
      am.trip_id as active_trip_id,
      am.status as active_load_status
    from parcels p
    left join active_matches am on am.parcel_id = p.id and am.rn = 1
    where p.company_id = ${input.companyId}
      and p.is_deleted = false
      and p.status not in (6, 11, 13, 14, 17, 18, 19)
      and (
        ${q}::text is null
        or p.booking_code ilike ${q}
        or p.tracking_code ilike ${q}
      )
    order by p.created_at desc, p.id desc
    limit ${input.limit}
  `);

  return rows;
}

export async function listFleetTripLoadAuditTrailRepo(input: {
  companyId: string;
  tripId: string;
  limit: number;
}) {
  return db
    .select({
      id: auditLogs.id,
      actorUserId: auditLogs.actorUserId,
      actorUserName: users.fullname,
      action: auditLogs.action,
      message: auditLogs.message,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(
      and(
        eq(auditLogs.companyId, input.companyId),
        eq(auditLogs.entityType, 'fleet_trip'),
        eq(auditLogs.entityId, input.tripId),
        inArray(auditLogs.action, ['FLEET_TRIP_LOAD_ASSIGNED', 'FLEET_TRIP_LOAD_STATUS_UPDATED']),
      ),
    )
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(input.limit);
}

export async function updateFleetTripLoadMatchRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof fleetTripLoadMatches.$inferInsert>,
) {
  const [row] = await db
    .update(fleetTripLoadMatches)
    .set(patch)
    .where(and(eq(fleetTripLoadMatches.id, id), eq(fleetTripLoadMatches.companyId, companyId)))
    .returning({
      id: fleetTripLoadMatches.id,
      tripId: fleetTripLoadMatches.tripId,
      status: fleetTripLoadMatches.status,
    });
  return row ?? null;
}

export async function getFleetTripLoadMatchByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: fleetTripLoadMatches.id,
      tripId: fleetTripLoadMatches.tripId,
      parcelId: fleetTripLoadMatches.parcelId,
      status: fleetTripLoadMatches.status,
      matchedBy: fleetTripLoadMatches.matchedBy,
      matchedAt: fleetTripLoadMatches.matchedAt,
      loadedAt: fleetTripLoadMatches.loadedAt,
      unloadedAt: fleetTripLoadMatches.unloadedAt,
      note: fleetTripLoadMatches.note,
    })
    .from(fleetTripLoadMatches)
    .where(and(eq(fleetTripLoadMatches.id, id), eq(fleetTripLoadMatches.companyId, companyId)));
  return row ?? null;
}

export async function createFleetTripTelemetryPointRepo(input: {
  companyId: string;
  tripId: string;
  sampledAt: Date;
  latitude: number;
  longitude: number;
  speedKph?: number | null;
  headingDeg?: number | null;
  altitudeM?: number | null;
  accuracyM?: number | null;
  source?: string | null;
  createdBy: string;
}) {
  const [row] = await db
    .insert(fleetTripTelemetryPoints)
    .values({
      companyId: input.companyId,
      tripId: input.tripId,
      sampledAt: input.sampledAt,
      latitude: input.latitude,
      longitude: input.longitude,
      speedKph: input.speedKph ?? null,
      headingDeg: input.headingDeg ?? null,
      altitudeM: input.altitudeM ?? null,
      accuracyM: input.accuracyM ?? null,
      source: input.source ?? null,
      createdBy: input.createdBy,
    })
    .returning({ id: fleetTripTelemetryPoints.id });
  return row ?? null;
}

export async function listFleetTripTelemetryPointsRepo(
  companyId: string,
  tripId: string,
  limit = 200,
) {
  return db
    .select({
      id: fleetTripTelemetryPoints.id,
      tripId: fleetTripTelemetryPoints.tripId,
      sampledAt: fleetTripTelemetryPoints.sampledAt,
      latitude: fleetTripTelemetryPoints.latitude,
      longitude: fleetTripTelemetryPoints.longitude,
      speedKph: fleetTripTelemetryPoints.speedKph,
      headingDeg: fleetTripTelemetryPoints.headingDeg,
      altitudeM: fleetTripTelemetryPoints.altitudeM,
      accuracyM: fleetTripTelemetryPoints.accuracyM,
      source: fleetTripTelemetryPoints.source,
      createdBy: fleetTripTelemetryPoints.createdBy,
      createdAt: fleetTripTelemetryPoints.createdAt,
    })
    .from(fleetTripTelemetryPoints)
    .where(
      and(
        eq(fleetTripTelemetryPoints.companyId, companyId),
        eq(fleetTripTelemetryPoints.tripId, tripId),
      ),
    )
    .orderBy(desc(fleetTripTelemetryPoints.sampledAt), desc(fleetTripTelemetryPoints.id))
    .limit(limit);
}

export async function createFleetTripStatusUpdateRepo(input: {
  companyId: string;
  tripId: string;
  statusType: number;
  occurredAt: Date;
  locationLabel?: string | null;
  note?: string | null;
  createdBy: string;
}) {
  const [row] = await db
    .insert(fleetTripStatusUpdates)
    .values({
      companyId: input.companyId,
      tripId: input.tripId,
      statusType: input.statusType,
      occurredAt: input.occurredAt,
      locationLabel: input.locationLabel ?? null,
      note: input.note ?? null,
      createdBy: input.createdBy,
    })
    .returning({ id: fleetTripStatusUpdates.id });
  return row ?? null;
}

export async function listFleetTripStatusUpdatesRepo(companyId: string, tripId: string) {
  return db
    .select({
      id: fleetTripStatusUpdates.id,
      tripId: fleetTripStatusUpdates.tripId,
      statusType: fleetTripStatusUpdates.statusType,
      occurredAt: fleetTripStatusUpdates.occurredAt,
      locationLabel: fleetTripStatusUpdates.locationLabel,
      note: fleetTripStatusUpdates.note,
      createdBy: fleetTripStatusUpdates.createdBy,
      createdAt: fleetTripStatusUpdates.createdAt,
      createdByName: users.fullname,
    })
    .from(fleetTripStatusUpdates)
    .leftJoin(users, eq(users.id, fleetTripStatusUpdates.createdBy))
    .where(
      and(
        eq(fleetTripStatusUpdates.companyId, companyId),
        eq(fleetTripStatusUpdates.tripId, tripId),
      ),
    )
    .orderBy(desc(fleetTripStatusUpdates.occurredAt), desc(fleetTripStatusUpdates.id));
}

export async function listFleetShiftRostersRepo(params: ListFleetShiftRostersParams) {
  const where = [eq(fleetShiftRosters.companyId, params.companyId)];
  if (params.branchId) where.push(eq(fleetShiftRosters.branchId, params.branchId));
  if (params.employeeId) where.push(eq(fleetShiftRosters.employeeId, params.employeeId));
  if (params.vehicleId) where.push(eq(fleetShiftRosters.vehicleId, params.vehicleId));
  if (typeof params.status === 'number') where.push(eq(fleetShiftRosters.status, params.status));
  if (params.dateFrom) where.push(gte(fleetShiftRosters.shiftEndAt, params.dateFrom));
  if (params.dateTo) where.push(lte(fleetShiftRosters.shiftStartAt, params.dateTo));

  const [countRow] = await db
    .select({ c: count() })
    .from(fleetShiftRosters)
    .where(and(...where));

  const rows = await db
    .select({
      id: fleetShiftRosters.id,
      branchId: fleetShiftRosters.branchId,
      employeeId: fleetShiftRosters.employeeId,
      employeeName: employees.displayName,
      vehicleId: fleetShiftRosters.vehicleId,
      vehiclePlateNumber: fleetVehicles.plateNumber,
      roleType: fleetShiftRosters.roleType,
      status: fleetShiftRosters.status,
      shiftStartAt: fleetShiftRosters.shiftStartAt,
      shiftEndAt: fleetShiftRosters.shiftEndAt,
      note: fleetShiftRosters.note,
      createdAt: fleetShiftRosters.createdAt,
      updatedAt: fleetShiftRosters.updatedAt,
    })
    .from(fleetShiftRosters)
    .innerJoin(employees, eq(employees.id, fleetShiftRosters.employeeId))
    .leftJoin(fleetVehicles, eq(fleetVehicles.id, fleetShiftRosters.vehicleId))
    .where(and(...where))
    .orderBy(desc(fleetShiftRosters.shiftStartAt), desc(fleetShiftRosters.id))
    .limit(params.limit)
    .offset(params.offset);

  return { data: rows, totalRecords: Number(countRow?.c ?? 0) };
}

export async function createFleetShiftRosterRepo(values: typeof fleetShiftRosters.$inferInsert) {
  const [row] = await db
    .insert(fleetShiftRosters)
    .values(values)
    .returning({ id: fleetShiftRosters.id });
  return row ?? null;
}

export async function updateFleetShiftRosterRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof fleetShiftRosters.$inferInsert>,
) {
  const [row] = await db
    .update(fleetShiftRosters)
    .set(patch)
    .where(and(eq(fleetShiftRosters.id, id), eq(fleetShiftRosters.companyId, companyId)))
    .returning({ id: fleetShiftRosters.id });
  return row ?? null;
}

export async function getFleetShiftRosterByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: fleetShiftRosters.id,
      companyId: fleetShiftRosters.companyId,
      branchId: fleetShiftRosters.branchId,
      employeeId: fleetShiftRosters.employeeId,
      vehicleId: fleetShiftRosters.vehicleId,
      roleType: fleetShiftRosters.roleType,
      status: fleetShiftRosters.status,
      shiftStartAt: fleetShiftRosters.shiftStartAt,
      shiftEndAt: fleetShiftRosters.shiftEndAt,
      note: fleetShiftRosters.note,
    })
    .from(fleetShiftRosters)
    .where(and(eq(fleetShiftRosters.id, id), eq(fleetShiftRosters.companyId, companyId)));
  return row ?? null;
}

export async function findFleetShiftConflictsRepo(input: {
  companyId: string;
  employeeId: string;
  vehicleId?: string | null;
  shiftStartAt: Date;
  shiftEndAt: Date;
  excludeRosterId?: string | null;
}) {
  const overlapCondition = and(
    lt(fleetShiftRosters.shiftStartAt, input.shiftEndAt),
    gt(fleetShiftRosters.shiftEndAt, input.shiftStartAt),
  )!;

  const employeeWhere = [
    eq(fleetShiftRosters.companyId, input.companyId),
    eq(fleetShiftRosters.employeeId, input.employeeId),
    ne(fleetShiftRosters.status, 2),
    overlapCondition,
  ];
  if (input.excludeRosterId) {
    employeeWhere.push(ne(fleetShiftRosters.id, input.excludeRosterId));
  }

  const [employeeConflict] = await db
    .select({ id: fleetShiftRosters.id })
    .from(fleetShiftRosters)
    .where(and(...employeeWhere))
    .limit(1);

  let vehicleConflict: { id: string } | null = null;
  if (input.vehicleId) {
    const vehicleWhere = [
      eq(fleetShiftRosters.companyId, input.companyId),
      eq(fleetShiftRosters.vehicleId, input.vehicleId),
      ne(fleetShiftRosters.status, 2),
      overlapCondition,
    ];
    if (input.excludeRosterId) {
      vehicleWhere.push(ne(fleetShiftRosters.id, input.excludeRosterId));
    }
    const [found] = await db
      .select({ id: fleetShiftRosters.id })
      .from(fleetShiftRosters)
      .where(and(...vehicleWhere))
      .limit(1);
    vehicleConflict = found ?? null;
  }

  return {
    employeeConflict: employeeConflict ?? null,
    vehicleConflict,
  };
}

export function isEmployeeAssignableToFleet(value: {
  isDeleted: boolean;
  employmentStatus: number | null;
}) {
  return !value.isDeleted && value.employmentStatus === EmploymentStatus.ACTIVE;
}

export async function listFleetFuelLogsRepo(params: ListFleetFuelLogsParams) {
  const where = [eq(fleetFuelLogs.companyId, params.companyId)];

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(fleetFuelLogs.logNo, q),
        ilike(fleetVehicles.plateNumber, q),
        ilike(fleetFuelLogs.stationName, q),
      )!,
    );
  }
  if (typeof params.status === 'number') {
    where.push(eq(fleetFuelLogs.status, params.status));
  }
  if (params.vehicleId) {
    where.push(eq(fleetFuelLogs.vehicleId, params.vehicleId));
  }
  if (params.pendingOnly) {
    where.push(eq(fleetFuelLogs.status, FleetFuelLogStatus.SUBMITTED));
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(fleetFuelLogs)
    .leftJoin(fleetVehicles, eq(fleetVehicles.id, fleetFuelLogs.vehicleId))
    .where(and(...where));

  const rows = await db
    .select({
      id: fleetFuelLogs.id,
      logNo: fleetFuelLogs.logNo,
      vehicleId: fleetFuelLogs.vehicleId,
      vehiclePlateNumber: fleetVehicles.plateNumber,
      liters: fleetFuelLogs.liters,
      fuelCostPsw: fleetFuelLogs.fuelCostPsw,
      odometerKm: fleetFuelLogs.odometerKm,
      stationName: fleetFuelLogs.stationName,
      note: fleetFuelLogs.note,
      status: fleetFuelLogs.status,
      loggedByUserId: fleetFuelLogs.loggedByUserId,
      loggedByName: users.fullname,
      approvedByUserId: fleetFuelLogs.approvedByUserId,
      rejectedByUserId: fleetFuelLogs.rejectedByUserId,
      rejectionReason: fleetFuelLogs.rejectionReason,
      approvedAt: fleetFuelLogs.approvedAt,
      rejectedAt: fleetFuelLogs.rejectedAt,
      createdAt: fleetFuelLogs.createdAt,
      updatedAt: fleetFuelLogs.updatedAt,
    })
    .from(fleetFuelLogs)
    .leftJoin(fleetVehicles, eq(fleetVehicles.id, fleetFuelLogs.vehicleId))
    .leftJoin(users, eq(users.id, fleetFuelLogs.loggedByUserId))
    .where(and(...where))
    .orderBy(desc(fleetFuelLogs.createdAt), desc(fleetFuelLogs.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function createFleetFuelLogRepo(values: typeof fleetFuelLogs.$inferInsert) {
  const [row] = await db.insert(fleetFuelLogs).values(values).returning({ id: fleetFuelLogs.id });
  return row;
}

export async function getFleetFuelLogByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: fleetFuelLogs.id,
      logNo: fleetFuelLogs.logNo,
      status: fleetFuelLogs.status,
      companyId: fleetFuelLogs.companyId,
    })
    .from(fleetFuelLogs)
    .where(and(eq(fleetFuelLogs.id, id), eq(fleetFuelLogs.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function listCompletedTripsForFuelAnalyticsRepo(
  params: ListFleetFuelAnalyticsTripsParams,
) {
  const where = [
    eq(fleetTrips.companyId, params.companyId),
    eq(fleetTrips.status, FleetTripStatus.COMPLETED),
  ];

  if (params.vehicleId) where.push(eq(fleetTrips.vehicleId, params.vehicleId));
  if (params.dateFrom) where.push(gte(fleetTrips.endedAt, params.dateFrom));
  if (params.dateTo) where.push(lte(fleetTrips.endedAt, params.dateTo));

  return db
    .select({
      id: fleetTrips.id,
      tripNo: fleetTrips.tripNo,
      branchId: fleetTrips.branchId,
      branchName: branches.name,
      vehicleId: fleetTrips.vehicleId,
      vehiclePlateNumber: fleetVehicles.plateNumber,
      routePlanId: fleetTrips.routePlanId,
      routePlanName: fleetRoutePlans.name,
      driverEmployeeId: fleetTrips.driverEmployeeId,
      driverEmployeeName: employees.displayName,
      plannedStartAt: fleetTrips.plannedStartAt,
      plannedEndAt: fleetTrips.plannedEndAt,
      startedAt: fleetTrips.startedAt,
      endedAt: fleetTrips.endedAt,
      startOdometerKm: fleetTrips.startOdometerKm,
      endOdometerKm: fleetTrips.endOdometerKm,
      expectedKmPerLiter: fleetVehicles.expectedKmPerLiter,
      fuelType: fleetVehicles.fuelType,
    })
    .from(fleetTrips)
    .innerJoin(fleetVehicles, eq(fleetVehicles.id, fleetTrips.vehicleId))
    .leftJoin(branches, eq(branches.id, fleetTrips.branchId))
    .leftJoin(fleetRoutePlans, eq(fleetRoutePlans.id, fleetTrips.routePlanId))
    .leftJoin(employees, eq(employees.id, fleetTrips.driverEmployeeId))
    .where(and(...where))
    .orderBy(desc(fleetTrips.endedAt), desc(fleetTrips.id))
    .limit(params.limit);
}

export async function listFleetTripLoadCountsRepo(companyId: string, tripIds: string[]) {
  if (!tripIds.length) return [] as Array<{ tripId: string; parcelCount: number }>;
  return db
    .select({
      tripId: fleetTripLoadMatches.tripId,
      parcelCount: sql<number>`count(*)`,
    })
    .from(fleetTripLoadMatches)
    .where(
      and(
        eq(fleetTripLoadMatches.companyId, companyId),
        inArray(fleetTripLoadMatches.tripId, tripIds),
        eq(fleetTripLoadMatches.status, 2),
      ),
    )
    .groupBy(fleetTripLoadMatches.tripId);
}

export async function listFleetTripCustomerStatsRepo(companyId: string, tripIds: string[]) {
  if (!tripIds.length) {
    return [] as Array<{
      tripId: string;
      senderId: string;
      senderName: string | null;
      parcelCount: number;
      revenuePsw: number;
    }>;
  }
  return db
    .select({
      tripId: fleetTripLoadMatches.tripId,
      senderId: parcels.senderId,
      senderName: customers.fullname,
      parcelCount: sql<number>`count(*)`,
      revenuePsw: sql<number>`coalesce(sum(${parcels.chargePsw}), 0)`,
    })
    .from(fleetTripLoadMatches)
    .innerJoin(parcels, eq(parcels.id, fleetTripLoadMatches.parcelId))
    .leftJoin(customers, eq(customers.id, parcels.senderId))
    .where(
      and(
        eq(fleetTripLoadMatches.companyId, companyId),
        inArray(fleetTripLoadMatches.tripId, tripIds),
        eq(fleetTripLoadMatches.status, 2),
      ),
    )
    .groupBy(fleetTripLoadMatches.tripId, parcels.senderId, customers.fullname);
}

export async function sumApprovedFuelLogsForTripWindowRepo(input: {
  companyId: string;
  vehicleId: string;
  startedAt: Date;
  endedAt: Date;
}) {
  const [row] = await db
    .select({
      liters: sql<number>`coalesce(sum(${fleetFuelLogs.liters}), 0)`,
      fuelCostPsw: sql<number>`coalesce(sum(${fleetFuelLogs.fuelCostPsw}), 0)`,
      logCount: sql<number>`count(*)`,
    })
    .from(fleetFuelLogs)
    .where(
      and(
        eq(fleetFuelLogs.companyId, input.companyId),
        eq(fleetFuelLogs.vehicleId, input.vehicleId),
        eq(fleetFuelLogs.status, FleetFuelLogStatus.APPROVED),
        gte(fleetFuelLogs.createdAt, input.startedAt),
        lte(fleetFuelLogs.createdAt, input.endedAt),
      ),
    );

  return {
    liters: Number(row?.liters ?? 0),
    fuelCostPsw: Number(row?.fuelCostPsw ?? 0),
    logCount: Number(row?.logCount ?? 0),
  };
}

export async function updateFleetFuelLogStatusRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof fleetFuelLogs.$inferInsert>,
) {
  const [row] = await db
    .update(fleetFuelLogs)
    .set(patch)
    .where(and(eq(fleetFuelLogs.id, id), eq(fleetFuelLogs.companyId, companyId)))
    .returning({ id: fleetFuelLogs.id });
  return row ?? null;
}

export async function updateFleetVehicleLifecycleRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof fleetVehicles.$inferInsert>,
) {
  const [row] = await db
    .update(fleetVehicles)
    .set(patch)
    .where(and(eq(fleetVehicles.id, id), eq(fleetVehicles.companyId, companyId)))
    .returning({ id: fleetVehicles.id, lifecycleStatus: fleetVehicles.lifecycleStatus });
  return row ?? null;
}

export async function listFleetComplianceIncidentsRepo(params: ListFleetComplianceIncidentsParams) {
  const where = [eq(fleetComplianceIncidents.companyId, params.companyId)];
  if (typeof params.incidentType === 'number') {
    where.push(eq(fleetComplianceIncidents.incidentType, params.incidentType));
  }
  if (typeof params.severity === 'number') {
    where.push(eq(fleetComplianceIncidents.severity, params.severity));
  }
  if (params.caseStatus === 'open') where.push(isNull(fleetComplianceIncidents.resolvedAt));
  if (params.caseStatus === 'resolved') where.push(isNotNull(fleetComplianceIncidents.resolvedAt));
  if (params.employeeId) where.push(eq(fleetComplianceIncidents.employeeId, params.employeeId));
  if (params.vehicleId) where.push(eq(fleetComplianceIncidents.vehicleId, params.vehicleId));

  const [countRow] = await db
    .select({ c: count() })
    .from(fleetComplianceIncidents)
    .where(and(...where));

  const rows = await db
    .select({
      id: fleetComplianceIncidents.id,
      tripId: fleetComplianceIncidents.tripId,
      vehicleId: fleetComplianceIncidents.vehicleId,
      employeeId: fleetComplianceIncidents.employeeId,
      incidentType: fleetComplianceIncidents.incidentType,
      severity: fleetComplianceIncidents.severity,
      occurredAt: fleetComplianceIncidents.occurredAt,
      locationLabel: fleetComplianceIncidents.locationLabel,
      description: fleetComplianceIncidents.description,
      actionTaken: fleetComplianceIncidents.actionTaken,
      resolvedAt: fleetComplianceIncidents.resolvedAt,
      reportedBy: fleetComplianceIncidents.reportedBy,
      reporterName: users.fullname,
      createdAt: fleetComplianceIncidents.createdAt,
      updatedAt: fleetComplianceIncidents.updatedAt,
    })
    .from(fleetComplianceIncidents)
    .leftJoin(users, eq(users.id, fleetComplianceIncidents.reportedBy))
    .where(and(...where))
    .orderBy(desc(fleetComplianceIncidents.occurredAt), desc(fleetComplianceIncidents.id))
    .limit(params.limit)
    .offset(params.offset);

  return { data: rows, totalRecords: Number(countRow?.c ?? 0) };
}

export async function createFleetComplianceIncidentRepo(
  values: typeof fleetComplianceIncidents.$inferInsert,
) {
  const [row] = await db
    .insert(fleetComplianceIncidents)
    .values(values)
    .returning({ id: fleetComplianceIncidents.id });
  return row ?? null;
}

export async function listFleetPolicyAcknowledgmentsRepo(
  params: ListFleetPolicyAcknowledgmentsParams,
) {
  const where = [eq(fleetPolicyAcknowledgments.companyId, params.companyId)];
  if (params.policyCode) where.push(eq(fleetPolicyAcknowledgments.policyCode, params.policyCode));
  if (params.employeeId) where.push(eq(fleetPolicyAcknowledgments.employeeId, params.employeeId));
  if (params.userId) where.push(eq(fleetPolicyAcknowledgments.userId, params.userId));

  const [countRow] = await db
    .select({ c: count() })
    .from(fleetPolicyAcknowledgments)
    .where(and(...where));

  const rows = await db
    .select({
      id: fleetPolicyAcknowledgments.id,
      employeeId: fleetPolicyAcknowledgments.employeeId,
      userId: fleetPolicyAcknowledgments.userId,
      policyCode: fleetPolicyAcknowledgments.policyCode,
      policyVersion: fleetPolicyAcknowledgments.policyVersion,
      status: fleetPolicyAcknowledgments.status,
      acknowledgedAt: fleetPolicyAcknowledgments.acknowledgedAt,
      note: fleetPolicyAcknowledgments.note,
      createdAt: fleetPolicyAcknowledgments.createdAt,
      updatedAt: fleetPolicyAcknowledgments.updatedAt,
      userName: users.fullname,
      employeeName: employees.displayName,
    })
    .from(fleetPolicyAcknowledgments)
    .leftJoin(users, eq(users.id, fleetPolicyAcknowledgments.userId))
    .leftJoin(employees, eq(employees.id, fleetPolicyAcknowledgments.employeeId))
    .where(and(...where))
    .orderBy(desc(fleetPolicyAcknowledgments.acknowledgedAt), desc(fleetPolicyAcknowledgments.id))
    .limit(params.limit)
    .offset(params.offset);

  return { data: rows, totalRecords: Number(countRow?.c ?? 0) };
}

export async function upsertFleetPolicyAcknowledgmentRepo(input: {
  companyId: string;
  employeeId?: string | null;
  userId?: string | null;
  policyCode: string;
  policyVersion: string;
  status: number;
  acknowledgedAt: Date;
  note?: string | null;
}) {
  const where = [
    eq(fleetPolicyAcknowledgments.companyId, input.companyId),
    eq(fleetPolicyAcknowledgments.policyCode, input.policyCode),
    eq(fleetPolicyAcknowledgments.policyVersion, input.policyVersion),
    input.employeeId
      ? eq(fleetPolicyAcknowledgments.employeeId, input.employeeId)
      : isNull(fleetPolicyAcknowledgments.employeeId),
    input.userId
      ? eq(fleetPolicyAcknowledgments.userId, input.userId)
      : isNull(fleetPolicyAcknowledgments.userId),
  ];

  const existing = await db
    .select({ id: fleetPolicyAcknowledgments.id })
    .from(fleetPolicyAcknowledgments)
    .where(and(...where))
    .limit(1);

  if (existing[0]?.id) {
    const [updated] = await db
      .update(fleetPolicyAcknowledgments)
      .set({
        status: input.status,
        acknowledgedAt: input.acknowledgedAt,
        note: input.note ?? null,
        updatedAt: new Date(),
      })
      .where(eq(fleetPolicyAcknowledgments.id, existing[0].id))
      .returning({ id: fleetPolicyAcknowledgments.id });
    return updated ?? null;
  }

  const [created] = await db
    .insert(fleetPolicyAcknowledgments)
    .values({
      companyId: input.companyId,
      employeeId: input.employeeId ?? null,
      userId: input.userId ?? null,
      policyCode: input.policyCode,
      policyVersion: input.policyVersion,
      status: input.status,
      acknowledgedAt: input.acknowledgedAt,
      note: input.note ?? null,
    })
    .returning({ id: fleetPolicyAcknowledgments.id });
  return created ?? null;
}

export async function listFleetMaintenancePartsRepo(params: ListFleetMaintenancePartsParams) {
  const where = [eq(fleetMaintenanceParts.companyId, params.companyId)];
  if (params.branchId) where.push(eq(fleetMaintenanceParts.branchId, params.branchId));
  if (typeof params.isActive === 'boolean')
    where.push(eq(fleetMaintenanceParts.isActive, params.isActive));
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(or(ilike(fleetMaintenanceParts.sku, q), ilike(fleetMaintenanceParts.name, q))!);
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(fleetMaintenanceParts)
    .where(and(...where));

  const rows = await db
    .select({
      id: fleetMaintenanceParts.id,
      branchId: fleetMaintenanceParts.branchId,
      sku: fleetMaintenanceParts.sku,
      name: fleetMaintenanceParts.name,
      category: fleetMaintenanceParts.category,
      unit: fleetMaintenanceParts.unit,
      qtyOnHand: fleetMaintenanceParts.qtyOnHand,
      reorderLevel: fleetMaintenanceParts.reorderLevel,
      averageUnitCostPsw: fleetMaintenanceParts.averageUnitCostPsw,
      isActive: fleetMaintenanceParts.isActive,
      note: fleetMaintenanceParts.note,
      createdAt: fleetMaintenanceParts.createdAt,
      updatedAt: fleetMaintenanceParts.updatedAt,
    })
    .from(fleetMaintenanceParts)
    .where(and(...where))
    .orderBy(asc(fleetMaintenanceParts.name), asc(fleetMaintenanceParts.id))
    .limit(params.limit)
    .offset(params.offset);

  return { data: rows, totalRecords: Number(countRow?.c ?? 0) };
}

export async function listFleetMaintenancePartMovementsRepo(
  params: ListFleetMaintenancePartMovementsParams,
) {
  const where = [
    eq(fleetMaintenancePartMovements.companyId, params.companyId),
    eq(fleetMaintenancePartMovements.partId, params.partId),
  ];
  const [countRow] = await db
    .select({ c: count() })
    .from(fleetMaintenancePartMovements)
    .where(and(...where));

  const rows = await db
    .select({
      id: fleetMaintenancePartMovements.id,
      partId: fleetMaintenancePartMovements.partId,
      workOrderId: fleetMaintenancePartMovements.workOrderId,
      movementType: fleetMaintenancePartMovements.movementType,
      quantity: fleetMaintenancePartMovements.quantity,
      unitCostPsw: fleetMaintenancePartMovements.unitCostPsw,
      note: fleetMaintenancePartMovements.note,
      movedAt: fleetMaintenancePartMovements.movedAt,
      movedBy: fleetMaintenancePartMovements.movedBy,
      movedByName: users.fullname,
      createdAt: fleetMaintenancePartMovements.createdAt,
    })
    .from(fleetMaintenancePartMovements)
    .leftJoin(users, eq(users.id, fleetMaintenancePartMovements.movedBy))
    .where(and(...where))
    .orderBy(desc(fleetMaintenancePartMovements.movedAt), desc(fleetMaintenancePartMovements.id))
    .limit(params.limit)
    .offset(params.offset);

  return { data: rows, totalRecords: Number(countRow?.c ?? 0) };
}

export async function listFleetMaintenancePartMovementsByWorkOrderRepo(input: {
  companyId: string;
  workOrderId: string;
  limit: number;
}) {
  return db
    .select({
      id: fleetMaintenancePartMovements.id,
      partId: fleetMaintenancePartMovements.partId,
      workOrderId: fleetMaintenancePartMovements.workOrderId,
      movementType: fleetMaintenancePartMovements.movementType,
      quantity: fleetMaintenancePartMovements.quantity,
      unitCostPsw: fleetMaintenancePartMovements.unitCostPsw,
      note: fleetMaintenancePartMovements.note,
      movedAt: fleetMaintenancePartMovements.movedAt,
      movedBy: fleetMaintenancePartMovements.movedBy,
      movedByName: users.fullname,
      createdAt: fleetMaintenancePartMovements.createdAt,
      partSku: fleetMaintenanceParts.sku,
      partName: fleetMaintenanceParts.name,
      partUnit: fleetMaintenanceParts.unit,
    })
    .from(fleetMaintenancePartMovements)
    .innerJoin(
      fleetMaintenanceParts,
      eq(fleetMaintenanceParts.id, fleetMaintenancePartMovements.partId),
    )
    .leftJoin(users, eq(users.id, fleetMaintenancePartMovements.movedBy))
    .where(
      and(
        eq(fleetMaintenancePartMovements.companyId, input.companyId),
        eq(fleetMaintenancePartMovements.workOrderId, input.workOrderId),
      ),
    )
    .orderBy(desc(fleetMaintenancePartMovements.movedAt), desc(fleetMaintenancePartMovements.id))
    .limit(input.limit);
}

export async function listFleetMaintenanceProcurementTraceabilityRepo(input: {
  companyId: string;
  branchId?: string | null;
  limit: number;
}) {
  const partWhere = [
    eq(fleetMaintenanceParts.companyId, input.companyId),
    eq(fleetMaintenanceParts.isActive, true),
  ];
  if (input.branchId) {
    partWhere.push(eq(fleetMaintenanceParts.branchId, input.branchId));
  }

  const parts = await db
    .select({
      partId: fleetMaintenanceParts.id,
      branchId: fleetMaintenanceParts.branchId,
      sku: fleetMaintenanceParts.sku,
      name: fleetMaintenanceParts.name,
      unit: fleetMaintenanceParts.unit,
      qtyOnHand: fleetMaintenanceParts.qtyOnHand,
      reorderLevel: fleetMaintenanceParts.reorderLevel,
      averageUnitCostPsw: fleetMaintenanceParts.averageUnitCostPsw,
    })
    .from(fleetMaintenanceParts)
    .where(and(...partWhere))
    .orderBy(asc(fleetMaintenanceParts.qtyOnHand), asc(fleetMaintenanceParts.id))
    .limit(input.limit);

  if (!parts.length) {
    return [] as Array<{
      partId: string;
      branchId: string | null;
      sku: string;
      name: string;
      unit: string;
      qtyOnHand: number;
      reorderLevel: number;
      averageUnitCostPsw: number;
      latestDemandId: string | null;
      latestDemandNo: string | null;
      latestDemandStatus: number | null;
      latestDemandUpdatedAt: Date | null;
      latestPoId: string | null;
      latestPoNo: string | null;
      latestPoStatus: number | null;
      orderedQty: number;
      receivedQty: number;
      lastReceiptAt: Date | null;
      issuedQty: number;
      lastIssuedAt: Date | null;
    }>;
  }

  const partIds = parts.map((row) => row.partId);
  const demands = await db
    .select({
      id: procurementDemands.id,
      demandNo: procurementDemands.demandNo,
      sourceEntityId: procurementDemands.sourceEntityId,
      status: procurementDemands.status,
      updatedAt: procurementDemands.updatedAt,
    })
    .from(procurementDemands)
    .where(
      and(
        eq(procurementDemands.companyId, input.companyId),
        eq(procurementDemands.sourceEntityType, 'fleet_maintenance_part'),
        inArray(procurementDemands.sourceEntityId, partIds),
      ),
    )
    .orderBy(desc(procurementDemands.updatedAt), desc(procurementDemands.id));

  const latestDemandByPart = new Map<
    string,
    { id: string; demandNo: string; status: number; updatedAt: Date }
  >();
  for (const demand of demands) {
    const key = demand.sourceEntityId ?? '';
    if (!key || latestDemandByPart.has(key)) continue;
    latestDemandByPart.set(key, {
      id: demand.id,
      demandNo: demand.demandNo,
      status: demand.status,
      updatedAt: demand.updatedAt,
    });
  }

  const demandIds = [...latestDemandByPart.values()].map((row) => row.id);
  const poItems = demandIds.length
    ? await db
        .select({
          poItemId: procurementPurchaseOrderItems.id,
          demandId: procurementPurchaseOrderItems.demandId,
          poId: procurementPurchaseOrders.id,
          poNo: procurementPurchaseOrders.poNo,
          poStatus: procurementPurchaseOrders.status,
          orderedQuantity: procurementPurchaseOrderItems.orderedQuantity,
          receivedQuantity: procurementPurchaseOrderItems.receivedQuantity,
          poCreatedAt: procurementPurchaseOrders.createdAt,
        })
        .from(procurementPurchaseOrderItems)
        .innerJoin(
          procurementPurchaseOrders,
          eq(procurementPurchaseOrders.id, procurementPurchaseOrderItems.purchaseOrderId),
        )
        .where(
          and(
            eq(procurementPurchaseOrders.companyId, input.companyId),
            inArray(procurementPurchaseOrderItems.demandId, demandIds),
          ),
        )
        .orderBy(desc(procurementPurchaseOrders.createdAt), desc(procurementPurchaseOrderItems.id))
    : [];

  const latestPoByDemand = new Map<
    string,
    {
      poItemId: string;
      poId: string;
      poNo: string;
      poStatus: number;
      orderedQuantity: number;
      receivedQuantity: number;
    }
  >();
  for (const row of poItems) {
    const demandId = row.demandId ?? '';
    if (!demandId || latestPoByDemand.has(demandId)) continue;
    latestPoByDemand.set(demandId, {
      poItemId: row.poItemId,
      poId: row.poId,
      poNo: row.poNo,
      poStatus: row.poStatus,
      orderedQuantity: Number(row.orderedQuantity ?? 0),
      receivedQuantity: Number(row.receivedQuantity ?? 0),
    });
  }

  const poItemIds = [...latestPoByDemand.values()].map((row) => row.poItemId);
  const receiptAgg = poItemIds.length
    ? await db
        .select({
          poItemId: procurementGoodsReceiptItems.purchaseOrderItemId,
          receivedQty: sql<number>`coalesce(sum(${procurementGoodsReceiptItems.receivedQuantity}), 0)`,
          lastReceiptAt: sql<Date | null>`max(${procurementGoodsReceipts.receivedAt})`,
        })
        .from(procurementGoodsReceiptItems)
        .innerJoin(
          procurementGoodsReceipts,
          eq(procurementGoodsReceipts.id, procurementGoodsReceiptItems.goodsReceiptId),
        )
        .where(
          and(
            eq(procurementGoodsReceipts.companyId, input.companyId),
            inArray(procurementGoodsReceiptItems.purchaseOrderItemId, poItemIds),
          ),
        )
        .groupBy(procurementGoodsReceiptItems.purchaseOrderItemId)
    : [];
  const receiptByPoItem = new Map(
    receiptAgg.map((row) => [
      row.poItemId,
      { receivedQty: Number(row.receivedQty ?? 0), lastReceiptAt: row.lastReceiptAt ?? null },
    ]),
  );

  const issueAgg = await db
    .select({
      partId: fleetMaintenancePartMovements.partId,
      issuedQty: sql<number>`coalesce(sum(${fleetMaintenancePartMovements.quantity}), 0)`,
      lastIssuedAt: sql<Date | null>`max(${fleetMaintenancePartMovements.movedAt})`,
    })
    .from(fleetMaintenancePartMovements)
    .where(
      and(
        eq(fleetMaintenancePartMovements.companyId, input.companyId),
        eq(fleetMaintenancePartMovements.movementType, 1),
        inArray(fleetMaintenancePartMovements.partId, partIds),
      ),
    )
    .groupBy(fleetMaintenancePartMovements.partId);
  const issueByPart = new Map(
    issueAgg.map((row) => [
      row.partId,
      { issuedQty: Number(row.issuedQty ?? 0), lastIssuedAt: row.lastIssuedAt ?? null },
    ]),
  );

  return parts.map((part) => {
    const demand = latestDemandByPart.get(part.partId);
    const po = demand ? latestPoByDemand.get(demand.id) : undefined;
    const receipt = po ? receiptByPoItem.get(po.poItemId) : undefined;
    const issue = issueByPart.get(part.partId);
    return {
      ...part,
      averageUnitCostPsw: Number(part.averageUnitCostPsw ?? 0),
      latestDemandId: demand?.id ?? null,
      latestDemandNo: demand?.demandNo ?? null,
      latestDemandStatus: demand?.status ?? null,
      latestDemandUpdatedAt: demand?.updatedAt ?? null,
      latestPoId: po?.poId ?? null,
      latestPoNo: po?.poNo ?? null,
      latestPoStatus: po?.poStatus ?? null,
      orderedQty: po?.orderedQuantity ?? 0,
      receivedQty: receipt?.receivedQty ?? 0,
      lastReceiptAt: receipt?.lastReceiptAt ?? null,
      issuedQty: issue?.issuedQty ?? 0,
      lastIssuedAt: issue?.lastIssuedAt ?? null,
    };
  });
}

export async function createFleetMaintenancePartRepo(
  values: typeof fleetMaintenanceParts.$inferInsert,
) {
  const [row] = await db
    .insert(fleetMaintenanceParts)
    .values(values)
    .returning({ id: fleetMaintenanceParts.id });
  return row ?? null;
}

export async function getFleetMaintenancePartByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: fleetMaintenanceParts.id,
      qtyOnHand: fleetMaintenanceParts.qtyOnHand,
      averageUnitCostPsw: fleetMaintenanceParts.averageUnitCostPsw,
      companyId: fleetMaintenanceParts.companyId,
    })
    .from(fleetMaintenanceParts)
    .where(and(eq(fleetMaintenanceParts.id, id), eq(fleetMaintenanceParts.companyId, companyId)));
  return row ?? null;
}

export async function updateFleetMaintenancePartRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof fleetMaintenanceParts.$inferInsert>,
) {
  const [row] = await db
    .update(fleetMaintenanceParts)
    .set(patch)
    .where(and(eq(fleetMaintenanceParts.id, id), eq(fleetMaintenanceParts.companyId, companyId)))
    .returning({ id: fleetMaintenanceParts.id });
  return row ?? null;
}

export async function createFleetMaintenancePartMovementRepo(
  values: typeof fleetMaintenancePartMovements.$inferInsert,
) {
  const [row] = await db
    .insert(fleetMaintenancePartMovements)
    .values(values)
    .returning({ id: fleetMaintenancePartMovements.id });
  return row ?? null;
}

export async function getFleetComplianceKpiRepo(companyId: string) {
  const [incidentSummary] = await db
    .select({
      openIncidents: sql<number>`coalesce(sum(case when ${fleetComplianceIncidents.resolvedAt} is null then 1 else 0 end), 0)`,
      criticalOpenIncidents: sql<number>`coalesce(sum(case when ${fleetComplianceIncidents.resolvedAt} is null and ${fleetComplianceIncidents.severity} = 3 then 1 else 0 end), 0)`,
      openViolations: sql<number>`coalesce(sum(case when ${fleetComplianceIncidents.resolvedAt} is null and ${fleetComplianceIncidents.incidentType} = 0 then 1 else 0 end), 0)`,
      openAccidents: sql<number>`coalesce(sum(case when ${fleetComplianceIncidents.resolvedAt} is null and ${fleetComplianceIncidents.incidentType} = 1 then 1 else 0 end), 0)`,
    })
    .from(fleetComplianceIncidents)
    .where(eq(fleetComplianceIncidents.companyId, companyId));

  const [policySummary] = await db
    .select({
      revokedPolicies: sql<number>`coalesce(sum(case when ${fleetPolicyAcknowledgments.status} = 1 then 1 else 0 end), 0)`,
    })
    .from(fleetPolicyAcknowledgments)
    .where(eq(fleetPolicyAcknowledgments.companyId, companyId));

  return {
    openIncidents: Number(incidentSummary?.openIncidents ?? 0),
    criticalOpenIncidents: Number(incidentSummary?.criticalOpenIncidents ?? 0),
    openViolations: Number(incidentSummary?.openViolations ?? 0),
    openAccidents: Number(incidentSummary?.openAccidents ?? 0),
    revokedPolicies: Number(policySummary?.revokedPolicies ?? 0),
  };
}

export async function getFleetComplianceIncidentByIdRepo(companyId: string, id: string) {
  const [row] = await db
    .select({
      id: fleetComplianceIncidents.id,
      companyId: fleetComplianceIncidents.companyId,
      incidentType: fleetComplianceIncidents.incidentType,
      severity: fleetComplianceIncidents.severity,
      resolvedAt: fleetComplianceIncidents.resolvedAt,
      actionTaken: fleetComplianceIncidents.actionTaken,
    })
    .from(fleetComplianceIncidents)
    .where(
      and(eq(fleetComplianceIncidents.companyId, companyId), eq(fleetComplianceIncidents.id, id)),
    )
    .limit(1);
  return row ?? null;
}

export async function updateFleetComplianceIncidentRepo(
  companyId: string,
  id: string,
  patch: Partial<typeof fleetComplianceIncidents.$inferInsert>,
) {
  const [row] = await db
    .update(fleetComplianceIncidents)
    .set(patch)
    .where(
      and(eq(fleetComplianceIncidents.companyId, companyId), eq(fleetComplianceIncidents.id, id)),
    )
    .returning({ id: fleetComplianceIncidents.id });
  return row ?? null;
}

export async function listFleetVehiclesForLifecycleAutomationRepo(input: {
  companyId: string;
  now: Date;
  limit: number;
}) {
  const baseWhere = [
    eq(fleetVehicles.companyId, input.companyId),
    eq(fleetVehicles.lifecycleStatus, 0),
    eq(fleetVehicles.isActive, true),
  ];

  const directRows = await db
    .select({
      id: fleetVehicles.id,
      plateNumber: fleetVehicles.plateNumber,
      ownershipType: fleetVehicles.ownershipType,
      insuranceExpiryAt: fleetVehicles.insuranceExpiryAt,
      roadworthyExpiryAt: fleetVehicles.roadworthyExpiryAt,
      leaseEndAt: fleetVehicles.leaseEndAt,
    })
    .from(fleetVehicles)
    .where(
      and(
        ...baseWhere,
        or(
          lte(fleetVehicles.insuranceExpiryAt, input.now),
          lte(fleetVehicles.roadworthyExpiryAt, input.now),
          lte(fleetVehicles.leaseEndAt, input.now),
        )!,
      ),
    )
    .limit(input.limit);

  const docExpiredRows = await db
    .select({
      vehicleId: fleetVehicleDocuments.vehicleId,
      c: count(),
    })
    .from(fleetVehicleDocuments)
    .innerJoin(fleetVehicles, eq(fleetVehicles.id, fleetVehicleDocuments.vehicleId))
    .where(
      and(
        eq(fleetVehicleDocuments.companyId, input.companyId),
        ...baseWhere,
        lte(fleetVehicleDocuments.expiresAt, input.now),
      ),
    )
    .groupBy(fleetVehicleDocuments.vehicleId);

  const docMap = new Map(docExpiredRows.map((row) => [row.vehicleId, Number(row.c ?? 0)]));
  const ids = new Set(directRows.map((row) => row.id));
  for (const row of docExpiredRows) ids.add(row.vehicleId);

  const missingMetaIds = Array.from(ids).filter((id) => !directRows.some((row) => row.id === id));
  const missingMetaRows =
    missingMetaIds.length === 0
      ? []
      : await db
          .select({
            id: fleetVehicles.id,
            plateNumber: fleetVehicles.plateNumber,
            ownershipType: fleetVehicles.ownershipType,
            insuranceExpiryAt: fleetVehicles.insuranceExpiryAt,
            roadworthyExpiryAt: fleetVehicles.roadworthyExpiryAt,
            leaseEndAt: fleetVehicles.leaseEndAt,
          })
          .from(fleetVehicles)
          .where(
            and(
              eq(fleetVehicles.companyId, input.companyId),
              inArray(fleetVehicles.id, missingMetaIds),
            ),
          );

  return [...directRows, ...missingMetaRows].slice(0, input.limit).map((row) => ({
    id: row.id,
    plateNumber: row.plateNumber,
    ownershipType: row.ownershipType,
    insuranceExpired: !!(row.insuranceExpiryAt && row.insuranceExpiryAt <= input.now),
    roadworthyExpired: !!(row.roadworthyExpiryAt && row.roadworthyExpiryAt <= input.now),
    leaseEnded: !!(row.leaseEndAt && row.leaseEndAt <= input.now),
    hasExpiredDocument: (docMap.get(row.id) ?? 0) > 0,
  }));
}

export async function listFleetVehiclesForLifecycleRecoveryRepo(input: {
  companyId: string;
  now: Date;
  limit: number;
}) {
  const rows = await db
    .select({
      id: fleetVehicles.id,
      plateNumber: fleetVehicles.plateNumber,
    })
    .from(fleetVehicles)
    .where(
      and(
        eq(fleetVehicles.companyId, input.companyId),
        eq(fleetVehicles.lifecycleStatus, 1),
        eq(fleetVehicles.isActive, true),
        or(
          isNull(fleetVehicles.insuranceExpiryAt),
          gt(fleetVehicles.insuranceExpiryAt, input.now),
        )!,
        or(
          isNull(fleetVehicles.roadworthyExpiryAt),
          gt(fleetVehicles.roadworthyExpiryAt, input.now),
        )!,
        sql`not exists (
          select 1 from ${fleetVehicleDocuments} d
          where d.company_id = ${fleetVehicles.companyId}
            and d.vehicle_id = ${fleetVehicles.id}
            and d.expires_at is not null
            and d.expires_at <= ${input.now.toISOString()}
        )`,
        sql`not exists (
          select 1 from ${fleetVehicleDowntimeEvents} e
          where e.company_id = ${fleetVehicles.companyId}
            and e.vehicle_id = ${fleetVehicles.id}
            and e.ended_at is null
        )`,
        sql`not exists (
          select 1 from ${fleetMaintenanceWorkOrders} w
          where w.company_id = ${fleetVehicles.companyId}
            and w.vehicle_id = ${fleetVehicles.id}
            and w.status in (${FleetMaintenanceWorkOrderStatus.OPEN}, ${FleetMaintenanceWorkOrderStatus.IN_PROGRESS})
        )`,
      ),
    )
    .orderBy(asc(fleetVehicles.plateNumber), asc(fleetVehicles.id))
    .limit(input.limit);

  return rows;
}

export async function listOpenFleetComplianceIncidentsForEscalationRepo(input: {
  companyId: string;
  occurredOnOrBefore?: Date | null;
  limit: number;
}) {
  const where = [
    eq(fleetComplianceIncidents.companyId, input.companyId),
    isNull(fleetComplianceIncidents.resolvedAt),
  ];
  if (input.occurredOnOrBefore) {
    where.push(lte(fleetComplianceIncidents.occurredAt, input.occurredOnOrBefore));
  }

  return db
    .select({
      id: fleetComplianceIncidents.id,
      tripId: fleetComplianceIncidents.tripId,
      vehicleId: fleetComplianceIncidents.vehicleId,
      employeeId: fleetComplianceIncidents.employeeId,
      incidentType: fleetComplianceIncidents.incidentType,
      severity: fleetComplianceIncidents.severity,
      occurredAt: fleetComplianceIncidents.occurredAt,
      locationLabel: fleetComplianceIncidents.locationLabel,
      description: fleetComplianceIncidents.description,
      actionTaken: fleetComplianceIncidents.actionTaken,
      reportedBy: fleetComplianceIncidents.reportedBy,
      reporterName: users.fullname,
    })
    .from(fleetComplianceIncidents)
    .leftJoin(users, eq(users.id, fleetComplianceIncidents.reportedBy))
    .where(and(...where))
    .orderBy(desc(fleetComplianceIncidents.severity), asc(fleetComplianceIncidents.occurredAt))
    .limit(input.limit);
}

export async function getFleetDispatchBoardMetricsRepo(companyId: string) {
  const [tripCounts] = await db
    .select({
      planned: sql<number>`coalesce(sum(case when ${fleetTrips.status} = 0 then 1 else 0 end), 0)`,
      inProgress: sql<number>`coalesce(sum(case when ${fleetTrips.status} = 1 then 1 else 0 end), 0)`,
      completed: sql<number>`coalesce(sum(case when ${fleetTrips.status} = 2 then 1 else 0 end), 0)`,
    })
    .from(fleetTrips)
    .where(eq(fleetTrips.companyId, companyId));

  const [loadCounts] = await db
    .select({
      assigned: sql<number>`coalesce(sum(case when ${fleetTripLoadMatches.status} = 0 then 1 else 0 end), 0)`,
      loaded: sql<number>`coalesce(sum(case when ${fleetTripLoadMatches.status} = 1 then 1 else 0 end), 0)`,
    })
    .from(fleetTripLoadMatches)
    .where(eq(fleetTripLoadMatches.companyId, companyId));

  const [openIncidents] = await db
    .select({
      c: sql<number>`coalesce(sum(case when ${fleetComplianceIncidents.resolvedAt} is null then 1 else 0 end), 0)`,
    })
    .from(fleetComplianceIncidents)
    .where(eq(fleetComplianceIncidents.companyId, companyId));

  return {
    tripCounts: {
      planned: Number(tripCounts?.planned ?? 0),
      inProgress: Number(tripCounts?.inProgress ?? 0),
      completed: Number(tripCounts?.completed ?? 0),
    },
    loadCounts: {
      assigned: Number(loadCounts?.assigned ?? 0),
      loaded: Number(loadCounts?.loaded ?? 0),
    },
    openIncidents: Number(openIncidents?.c ?? 0),
  };
}

export async function getFleetDispatchOpsPerformanceRepo(input: {
  companyId: string;
  windowStart: Date;
}) {
  const [tripStatsRow] = await db
    .select({
      plannedTrips: sql<number>`coalesce(sum(case when ${fleetTrips.status} = 0 then 1 else 0 end), 0)`,
      inProgressTrips: sql<number>`coalesce(sum(case when ${fleetTrips.status} = 1 then 1 else 0 end), 0)`,
      completedTrips: sql<number>`coalesce(sum(case when ${fleetTrips.status} = 2 then 1 else 0 end), 0)`,
      onTimeCompletedTrips: sql<number>`coalesce(sum(case when ${fleetTrips.status} = 2 and ${fleetTrips.plannedEndAt} is not null and ${fleetTrips.endedAt} is not null and ${fleetTrips.endedAt} <= ${fleetTrips.plannedEndAt} then 1 else 0 end), 0)`,
      plannedTripsWithRoute: sql<number>`coalesce(sum(case when ${fleetTrips.status} = 0 and ${fleetTrips.routePlanId} is not null then 1 else 0 end), 0)`,
    })
    .from(fleetTrips)
    .where(
      and(
        eq(fleetTrips.companyId, input.companyId),
        sql`coalesce(${fleetTrips.startedAt}, ${fleetTrips.plannedStartAt}, ${fleetTrips.createdAt}) >= ${input.windowStart}`,
      ),
    );

  const [checkEventStatsRow] = await db
    .select({
      checkInEvents: sql<number>`coalesce(sum(case when ${fleetTripEvents.eventType} = 0 then 1 else 0 end), 0)`,
      checkOutEvents: sql<number>`coalesce(sum(case when ${fleetTripEvents.eventType} = 1 then 1 else 0 end), 0)`,
      tripsWithCheckIn: sql<number>`count(distinct case when ${fleetTripEvents.eventType} = 0 then ${fleetTripEvents.tripId} else null end)`,
      tripsWithCheckOut: sql<number>`count(distinct case when ${fleetTripEvents.eventType} = 1 then ${fleetTripEvents.tripId} else null end)`,
    })
    .from(fleetTripEvents)
    .where(
      and(
        eq(fleetTripEvents.companyId, input.companyId),
        gte(fleetTripEvents.occurredAt, input.windowStart),
      ),
    );

  const [statusUpdateStatsRow] = await db
    .select({
      delayedUpdates: sql<number>`coalesce(sum(case when ${fleetTripStatusUpdates.statusType} = 3 then 1 else 0 end), 0)`,
      stoppedUpdates: sql<number>`coalesce(sum(case when ${fleetTripStatusUpdates.statusType} = 4 then 1 else 0 end), 0)`,
    })
    .from(fleetTripStatusUpdates)
    .where(
      and(
        eq(fleetTripStatusUpdates.companyId, input.companyId),
        gte(fleetTripStatusUpdates.occurredAt, input.windowStart),
      ),
    );

  const [loadStatsRow] = await db
    .select({
      assignedLoads: sql<number>`coalesce(sum(case when ${fleetTripLoadMatches.status} = 0 then 1 else 0 end), 0)`,
      loadedLoads: sql<number>`coalesce(sum(case when ${fleetTripLoadMatches.status} = 1 then 1 else 0 end), 0)`,
      unloadedLoads: sql<number>`coalesce(sum(case when ${fleetTripLoadMatches.status} = 2 then 1 else 0 end), 0)`,
      cancelledLoads: sql<number>`coalesce(sum(case when ${fleetTripLoadMatches.status} = 3 then 1 else 0 end), 0)`,
    })
    .from(fleetTripLoadMatches)
    .where(
      and(
        eq(fleetTripLoadMatches.companyId, input.companyId),
        gte(fleetTripLoadMatches.matchedAt, input.windowStart),
      ),
    );

  return {
    tripStats: {
      plannedTrips: Number(tripStatsRow?.plannedTrips ?? 0),
      inProgressTrips: Number(tripStatsRow?.inProgressTrips ?? 0),
      completedTrips: Number(tripStatsRow?.completedTrips ?? 0),
      onTimeCompletedTrips: Number(tripStatsRow?.onTimeCompletedTrips ?? 0),
      plannedTripsWithRoute: Number(tripStatsRow?.plannedTripsWithRoute ?? 0),
    },
    checkEventStats: {
      checkInEvents: Number(checkEventStatsRow?.checkInEvents ?? 0),
      checkOutEvents: Number(checkEventStatsRow?.checkOutEvents ?? 0),
      tripsWithCheckIn: Number(checkEventStatsRow?.tripsWithCheckIn ?? 0),
      tripsWithCheckOut: Number(checkEventStatsRow?.tripsWithCheckOut ?? 0),
    },
    statusUpdateStats: {
      delayedUpdates: Number(statusUpdateStatsRow?.delayedUpdates ?? 0),
      stoppedUpdates: Number(statusUpdateStatsRow?.stoppedUpdates ?? 0),
    },
    loadStats: {
      assignedLoads: Number(loadStatsRow?.assignedLoads ?? 0),
      loadedLoads: Number(loadStatsRow?.loadedLoads ?? 0),
      unloadedLoads: Number(loadStatsRow?.unloadedLoads ?? 0),
      cancelledLoads: Number(loadStatsRow?.cancelledLoads ?? 0),
    },
  };
}

export async function listFleetLowStockPartsRepo(input: {
  companyId: string;
  limit: number;
  branchId?: string | null;
}) {
  const where = [
    eq(fleetMaintenanceParts.companyId, input.companyId),
    eq(fleetMaintenanceParts.isActive, true),
    sql`${fleetMaintenanceParts.qtyOnHand} <= ${fleetMaintenanceParts.reorderLevel}`,
  ];
  if (input.branchId) {
    where.push(eq(fleetMaintenanceParts.branchId, input.branchId));
  }
  return db
    .select({
      id: fleetMaintenanceParts.id,
      branchId: fleetMaintenanceParts.branchId,
      sku: fleetMaintenanceParts.sku,
      name: fleetMaintenanceParts.name,
      qtyOnHand: fleetMaintenanceParts.qtyOnHand,
      reorderLevel: fleetMaintenanceParts.reorderLevel,
      unit: fleetMaintenanceParts.unit,
    })
    .from(fleetMaintenanceParts)
    .where(and(...where))
    .orderBy(asc(fleetMaintenanceParts.qtyOnHand), asc(fleetMaintenanceParts.id))
    .limit(input.limit);
}

export async function listFleetLowStockProcurementCandidatesRepo(input: {
  companyId: string;
  limit: number;
  branchId?: string | null;
}) {
  const where = [
    eq(fleetMaintenanceParts.companyId, input.companyId),
    eq(fleetMaintenanceParts.isActive, true),
    sql`${fleetMaintenanceParts.qtyOnHand} < ${fleetMaintenanceParts.reorderLevel}`,
  ];
  if (input.branchId) {
    where.push(eq(fleetMaintenanceParts.branchId, input.branchId));
  }
  const rows = await db
    .select({
      partId: fleetMaintenanceParts.id,
      branchId: fleetMaintenanceParts.branchId,
      sku: fleetMaintenanceParts.sku,
      name: fleetMaintenanceParts.name,
      unit: fleetMaintenanceParts.unit,
      qtyOnHand: fleetMaintenanceParts.qtyOnHand,
      reorderLevel: fleetMaintenanceParts.reorderLevel,
      averageUnitCostPsw: fleetMaintenanceParts.averageUnitCostPsw,
    })
    .from(fleetMaintenanceParts)
    .where(and(...where))
    .orderBy(asc(fleetMaintenanceParts.branchId), asc(fleetMaintenanceParts.name))
    .limit(input.limit);

  return rows.map((row) => {
    const qtyOnHand = Number(row.qtyOnHand ?? 0);
    const reorderLevel = Number(row.reorderLevel ?? 0);
    const averageUnitCostPsw = Number(row.averageUnitCostPsw ?? 0);
    const suggestedQty = Math.max(reorderLevel - qtyOnHand, 0);
    return {
      ...row,
      qtyOnHand,
      reorderLevel,
      averageUnitCostPsw,
      suggestedQty,
      suggestedAmountPsw: suggestedQty * averageUnitCostPsw,
    };
  });
}

export async function listFleetPolicyReackTargetsRepo(input: {
  companyId: string;
  dueOnOrBefore: Date;
  limit: number;
}) {
  return db
    .select({
      id: fleetPolicyAcknowledgments.id,
      userId: fleetPolicyAcknowledgments.userId,
      policyCode: fleetPolicyAcknowledgments.policyCode,
      policyVersion: fleetPolicyAcknowledgments.policyVersion,
      acknowledgedAt: fleetPolicyAcknowledgments.acknowledgedAt,
      userName: users.fullname,
      userEmail: users.email,
    })
    .from(fleetPolicyAcknowledgments)
    .innerJoin(users, eq(users.id, fleetPolicyAcknowledgments.userId))
    .where(
      and(
        eq(fleetPolicyAcknowledgments.companyId, input.companyId),
        eq(fleetPolicyAcknowledgments.status, 0),
        lte(fleetPolicyAcknowledgments.acknowledgedAt, input.dueOnOrBefore),
        eq(users.status, UserStatus.ACTIVE),
        isNotNull(users.email),
      ),
    )
    .orderBy(asc(fleetPolicyAcknowledgments.acknowledgedAt), asc(fleetPolicyAcknowledgments.id))
    .limit(input.limit);
}
