import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginationRequestDto, PaginatedResponseDto } from '@/server/types/pagination.types';
import {
  approveFleetFuelLogSvc,
  createFleetFuelLogSvc,
  createFleetVehicleSvc,
  listFleetFuelLogsSvc,
  listFleetVehicleOptionsSvc,
  listFleetVehiclesSvc,
  rejectFleetFuelLogSvc,
  updateFleetVehicleSvc,
} from './service';

function toFleetVehicleDto(row: {
  id: string;
  plateNumber: string;
  model: string;
  assignedDriverUserId: string | null;
  assignedDriverName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFleetFuelLogDto(row: {
  id: string;
  logNo: string;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  liters: number;
  fuelCostPsw: number;
  odometerKm: number | null;
  stationName: string | null;
  note: string | null;
  status: number;
  loggedByUserId: string;
  loggedByName: string | null;
  approvedByUserId: string | null;
  rejectedByUserId: string | null;
  rejectionReason: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    rejectedAt: row.rejectedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listFleetVehiclesCtrl(
  q: PaginationRequestDto<{ companyId: string; search?: string; isActive?: boolean }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toFleetVehicleDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listFleetVehiclesSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    isActive: q.filters?.isActive ?? null,
  });

  return {
    data: data.map(toFleetVehicleDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function listFleetVehicleOptionsCtrl(input: {
  companyId: string;
  search?: string | null;
  isActive?: boolean | null;
}) {
  return listFleetVehicleOptionsSvc(input);
}

export async function createFleetVehicleCtrl(input: {
  companyId: string;
  createdBy: string;
  branchId?: string | null;
  plateNumber: string;
  model: string;
  assignedDriverUserId?: string | null;
}) {
  return createFleetVehicleSvc(input);
}

export async function updateFleetVehicleCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: {
    branchId?: string | null;
    plateNumber?: string;
    model?: string;
    assignedDriverUserId?: string | null;
    isActive?: boolean;
  };
}) {
  return updateFleetVehicleSvc(input);
}

export async function listFleetFuelLogsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    search?: string;
    status?: number;
    vehicleId?: string;
    pendingOnly?: boolean;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toFleetFuelLogDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listFleetFuelLogsSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    status: q.filters?.status ?? null,
    vehicleId: q.filters?.vehicleId ?? null,
    pendingOnly: q.filters?.pendingOnly ?? null,
  });

  return {
    data: data.map(toFleetFuelLogDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createFleetFuelLogCtrl(input: {
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
  return createFleetFuelLogSvc(input);
}

export async function approveFleetFuelLogCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  return approveFleetFuelLogSvc(input);
}

export async function rejectFleetFuelLogCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
  rejectionReason: string;
}) {
  return rejectFleetFuelLogSvc(input);
}
