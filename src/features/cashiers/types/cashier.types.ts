import type { ServerListQuery } from '@/services/rtk-query';

export interface CashierSessionType {
  id: string;
  sessionType: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashierSession {
  id: string;
  cashierId: string;
  branchId: string;
  shiftTypeId: string | null;
  scheduledStartTime: string;
  actualEndTime: string | null;
  openingBalancePsw: number;
  closingBalancePsw: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type CashierSessionFilters = {
  cashierId?: string | null;
  branchId?: string | null;
  activeOnly?: boolean | null;
};

export type CashierSessionListQuery = ServerListQuery<CashierSessionFilters>;

export interface OpenCashierSessionInput {
  sessionTypeId: string;
  startTime: string;
  openingBalanceCedis?: number;
}

export interface CloseCashierSessionInput {
  endTime: string;
  closingBalanceCedis?: number;
}
