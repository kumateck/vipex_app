import type { ServerListQuery } from '@/services/rtk-query/types';

export interface StockLevel {
  id: string;
  companyId: string;
  productId: string;
  locationId: string;
  quantity: string;
  updatedAt?: string;
}

export type StockLevelFilters = {
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
};

export type StockLevelListQuery = ServerListQuery<StockLevelFilters>;

export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  locationId: string;
  movementType: number;
  quantity: string;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
}

export type StockMovementFilters = {
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
  movementType?: number | null;
};

export type StockMovementListQuery = ServerListQuery<StockMovementFilters>;

export interface StockMovementCreateInput {
  productId: string;
  locationId: string;
  movementType: number;
  quantity: string;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
}

export interface StockMovementCreatePayload extends StockMovementCreateInput {
  companyId: string;
  createdBy: string;
}

export interface StockAdjustment {
  id: string;
  companyId: string;
  productId: string;
  locationId: string;
  reason: number;
  quantityChange: string;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
}

export type StockAdjustmentFilters = {
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
};

export type StockAdjustmentListQuery = ServerListQuery<StockAdjustmentFilters>;

export interface StockAdjustmentCreateInput {
  productId: string;
  locationId: string;
  reason: number;
  quantityChange: string;
  notes?: string;
}

export interface StockAdjustmentCreatePayload extends StockAdjustmentCreateInput {
  companyId: string;
  createdBy: string;
}

export interface StockTransfer {
  id: string;
  companyId: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: string;
  status: number;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
  completedBy?: string | null;
  completedAt?: string | null;
  updatedAt?: string;
}

export type StockTransferFilters = {
  companyId?: string | null;
  productId?: string | null;
  status?: number | null;
};

export type StockTransferListQuery = ServerListQuery<StockTransferFilters>;

export interface StockTransferCreateInput {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: string;
  notes?: string;
}

export interface StockTransferCreatePayload extends StockTransferCreateInput {
  companyId: string;
  createdBy: string;
}

export interface StockTransferUpdateInput {
  status: number;
}

export interface StockTransferUpdatePayload extends StockTransferUpdateInput {
  completedBy?: string;
}
