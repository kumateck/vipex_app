import { parcelApiPart1 } from '../parcel-endpoints/parcel-booking.endpoints';
import { parcelApiPart2 } from '../parcel-endpoints/parcel-storage.endpoints';
import { parcelApiPart3 } from '../parcel-endpoints/parcel-cashier.endpoints';
import { parcelApiPart4 } from '../parcel-endpoints/parcel-movement.endpoints';
import { parcelApiPart5 } from '../parcel-endpoints/parcel-delivery.endpoints';

export type ParcelInternalTransferRow = {
  id: string;
  companyId: string;
  branchId: string;
  branchName: string | null;
  referenceNo: string | null;
  sourceHolderType: number;
  sourceLocationId: string | null;
  sourceLocationName: string | null;
  sourceWarehouseId: string | null;
  sourceWarehouseName: string | null;
  destinationHolderType: number;
  destinationLocationId: string | null;
  destinationLocationName: string | null;
  destinationWarehouseId: string | null;
  destinationWarehouseName: string | null;
  notes: string | null;
  status: number;
  transferredBy: string;
  transferredByName: string | null;
  transferredAt: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  itemCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ParcelInternalTransferDetails = {
  transfer: ParcelInternalTransferRow & {
    acknowledgedByName?: string | null;
    cancelledBy?: string | null;
    cancelledAt?: string | null;
    cancelReason?: string | null;
  };
  items: Array<{
    parcelId: string;
    trackingCode: string;
    bookingCode: string;
    parcelDetails: string;
    receiverId: string;
    receiverName: string | null;
    receiverPhone: string | null;
    status: number;
    addedAt: string | null;
  }>;
};

export type SenderCashierParcelFilters = {
  companyId?: string | null;
  sourceId?: string | null;
  destinationId?: string | null;
  locationId?: string | null;
  status?: number | null;
  includeDeleted?: boolean | null;
};

export type ParcelSearchFilters = {
  companyId?: string | null;
  sourceId?: string | null;
  destinationId?: string | null;
  locationId?: string | null;
  status?: number | null;
  statuses?: number[] | null;
  senderPaid?: boolean | null;
  paymentType?: 'paid' | 'to_be_paid' | 'partial' | null;
  hasPickupQueue?: boolean | null;
  agedOnly?: boolean | null;
  storageChargeAccruing?: boolean | null;
  cashierCollectionRequired?: boolean | null;
  includeDeleted?: boolean | null;
  assignedToCurrentUser?: boolean | null;
  callCenterUncalledOnly?: boolean | null;
  sentDate?: string | null;
  consignmentNumber?: string | null;
};

export type IncomingConsignmentRow = {
  id: string;
  code: string;
  sourceId: string;
  sourceName: string;
  destinationId: string;
  consignmentDate: string;
  serialForDay: number;
  status: number;
  closedBy: string | null;
  closedAt: string | null;
  closedWithExceptions: boolean;
  closeExceptionReason: string | null;
  arrived: number;
  total: number;
};

export type ConsignmentDetail = Omit<IncomingConsignmentRow, 'sourceName' | 'arrived' | 'total'> & {
  companyId: string;
  arrived: number;
  total: number;
};

export type ConsignmentItemRow = {
  parcelId: string;
  trackingCode: string;
  bookingCode: string;
  parcelDetails: string;
  senderName: string;
  receiverName: string;
  addedAt: string;
  arrivedAt: string | null;
  arrivedBy: string | null;
  arrivedByName: string | null;
};

export type PreviousConsignmentRow = {
  id: string;
  code: string;
  sourceId: string;
  sourceName: string;
  destinationId: string;
  destinationName: string;
  consignmentDate: string;
  createdAt: string;
  status: number;
  itemCount: number;
};

export type ConsignmentPrintItem = {
  id: string;
  senderName: string | null;
  senderPhone: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  parcelDetails: string | null;
  chargeExemptCustomerType?: number | null;
  relatedStaffId?: string | null;
  relatedStaffNameSnapshot?: string | null;
  chargePsw: number;
  plannedToBePaidPsw: number;
};

export type SavedConsignmentPrintPayload = {
  consignmentCode: string;
  destinationName: string;
  items: ConsignmentPrintItem[];
};

export type ReceiveConsignmentItemResult =
  | {
      outcome: 'RECEIVED';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      arrived: number;
      total: number;
    }
  | {
      outcome: 'ALREADY_RECEIVED';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      arrivedAt: string;
      arrivedByName: string | null;
    }
  | {
      outcome: 'WRONG_CONSIGNMENT';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      belongsToConsignmentId: string | null;
      belongsToConsignmentCode: string | null;
    }
  | {
      outcome: 'NOT_DISPATCHED';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      sourceBranchId: string;
      sourceBranchName: string | null;
    };

export type CloseConsignmentResult = {
  status: number;
  arrived: number;
  total: number;
  missingParcelIds: string[];
};

export const parcelApi = Object.assign(
  Object.assign(
    Object.assign(Object.assign(parcelApiPart1, parcelApiPart2), parcelApiPart3),
    parcelApiPart4,
  ),
  parcelApiPart5,
);
