import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { FleetFuelLogStatus, fleetFuelLogs, fleetVehicles, users } from '@/db/schemas';

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
      plateNumber: fleetVehicles.plateNumber,
      model: fleetVehicles.model,
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
