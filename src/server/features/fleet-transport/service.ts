import { Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { FleetFuelLogStatus, fleetFuelLogs, fleetVehicles } from '@/db/schemas';
import {
  createFleetFuelLogRepo,
  createFleetVehicleRepo,
  findFleetVehicleByPlateRepo,
  getFleetFuelLogByIdRepo,
  listFleetFuelLogsRepo,
  listFleetVehicleOptionsRepo,
  listFleetVehiclesRepo,
  type ListFleetFuelLogsParams,
  type ListFleetVehiclesParams,
  updateFleetFuelLogStatusRepo,
  updateFleetVehicleRepo,
} from './repository';

function buildFuelLogNo() {
  return `FL-${Date.now().toString(36).toUpperCase()}`;
}

export async function listFleetVehiclesSvc(params: ListFleetVehiclesParams) {
  return listFleetVehiclesRepo(params);
}

export async function listFleetVehicleOptionsSvc(input: {
  companyId: string;
  search?: string | null;
  isActive?: boolean | null;
}) {
  return listFleetVehicleOptionsRepo(input);
}

export async function createFleetVehicleSvc(input: {
  companyId: string;
  createdBy: string;
  branchId?: string | null;
  plateNumber: string;
  model: string;
  assignedDriverUserId?: string | null;
}) {
  const exists = await findFleetVehicleByPlateRepo(input.companyId, input.plateNumber);
  if (exists) throw Conflict('Vehicle with this plate number already exists');

  const created = await createFleetVehicleRepo({
    companyId: input.companyId,
    createdBy: input.createdBy,
    branchId: input.branchId ?? null,
    plateNumber: input.plateNumber,
    model: input.model,
    assignedDriverUserId: input.assignedDriverUserId ?? null,
  });

  if (!created) throw Conflict('Failed to create vehicle');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'fleet_vehicle',
    entityId: created.id,
    action: 'FLEET_VEHICLE_CREATED',
    message: `Vehicle created: ${input.plateNumber}`,
  });

  return created;
}

export async function updateFleetVehicleSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: Partial<typeof fleetVehicles.$inferInsert>;
}) {
  const updated = await updateFleetVehicleRepo(input.id, input.companyId, input.patch);
  if (!updated) throw NotFound('Vehicle not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_vehicle',
    entityId: input.id,
    action: 'FLEET_VEHICLE_UPDATED',
    message: 'Vehicle updated',
    metadata: { patch: input.patch },
  });

  return updated;
}

export async function listFleetFuelLogsSvc(params: ListFleetFuelLogsParams) {
  return listFleetFuelLogsRepo(params);
}

export async function createFleetFuelLogSvc(input: {
  companyId: string;
  loggedByUserId: string;
  branchId?: string | null;
  vehicleId: string;
  liters: number;
  fuelCostPsw: number;
  odometerKm?: number | null;
  stationName?: string | null;
  note?: string | null;
}) {
  const created = await createFleetFuelLogRepo({
    companyId: input.companyId,
    logNo: buildFuelLogNo(),
    branchId: input.branchId ?? null,
    vehicleId: input.vehicleId,
    liters: input.liters,
    fuelCostPsw: input.fuelCostPsw,
    odometerKm: input.odometerKm ?? null,
    stationName: input.stationName ?? null,
    note: input.note ?? null,
    status: FleetFuelLogStatus.SUBMITTED,
    loggedByUserId: input.loggedByUserId,
  });

  if (!created) throw Conflict('Failed to create fuel log');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.loggedByUserId,
    entityType: 'fleet_fuel_log',
    entityId: created.id,
    action: 'FLEET_FUEL_LOG_CREATED',
    message: 'Fuel log created',
    metadata: { liters: input.liters, fuelCostPsw: input.fuelCostPsw },
  });

  return created;
}

export async function approveFleetFuelLogSvc(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  const existing = await getFleetFuelLogByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Fuel log not found');
  if (existing.status !== FleetFuelLogStatus.SUBMITTED) {
    throw Conflict('Only submitted fuel logs can be approved');
  }

  const updated = await updateFleetFuelLogStatusRepo(input.id, input.companyId, {
    status: FleetFuelLogStatus.APPROVED,
    approvedByUserId: input.approverUserId,
    approvedAt: new Date(),
    rejectedByUserId: null,
    rejectedAt: null,
    rejectionReason: null,
  } satisfies Partial<typeof fleetFuelLogs.$inferInsert>);

  if (!updated) throw NotFound('Fuel log not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'fleet_fuel_log',
    entityId: input.id,
    action: 'FLEET_FUEL_LOG_APPROVED',
    message: `Fuel log approved: ${existing.logNo}`,
  });

  return updated;
}

export async function rejectFleetFuelLogSvc(input: {
  id: string;
  companyId: string;
  approverUserId: string;
  rejectionReason: string;
}) {
  const existing = await getFleetFuelLogByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Fuel log not found');
  if (existing.status !== FleetFuelLogStatus.SUBMITTED) {
    throw Conflict('Only submitted fuel logs can be rejected');
  }

  const updated = await updateFleetFuelLogStatusRepo(input.id, input.companyId, {
    status: FleetFuelLogStatus.REJECTED,
    rejectedByUserId: input.approverUserId,
    rejectedAt: new Date(),
    rejectionReason: input.rejectionReason,
    approvedByUserId: null,
    approvedAt: null,
  } satisfies Partial<typeof fleetFuelLogs.$inferInsert>);

  if (!updated) throw NotFound('Fuel log not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'fleet_fuel_log',
    entityId: input.id,
    action: 'FLEET_FUEL_LOG_REJECTED',
    message: `Fuel log rejected: ${existing.logNo}`,
    metadata: { rejectionReason: input.rejectionReason },
  });

  return updated;
}
