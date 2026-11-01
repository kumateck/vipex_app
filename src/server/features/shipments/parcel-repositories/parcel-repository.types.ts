import { sql } from 'drizzle-orm';
import { db } from '@/db/config';

import type { SortField } from '@/server/types/pagination.types';

export type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export function effectiveParcelReceivedAt() {
  return sql<Date | null>`coalesce(
    "parcels"."received_at",
    (
      select min(receive_audit.created_at)
      from audit_logs receive_audit
      where receive_audit.entity_type = 'parcel'
        and receive_audit.entity_id = "parcels"."id"
        and receive_audit.action = 'PARCEL_UPDATED'
        and receive_audit.metadata->'patch'->>'status' = '3'
    )
  )`.mapWith((value) => (value == null ? null : new Date(String(value))));
}

export type ParcelRow = {
  id: string;
  companyId: string;
  sourceId: string;
  sourceLocationId: string | null;
  destinationId: string;
  bookingId: string;
  bookingCode: string;
  trackingCode: string;
  senderId: string;
  senderNameSnapshot: string;
  receiverId: string;
  receiverNameSnapshot: string;
  secondReceiverId: string | null;
  secondReceiverNameSnapshot: string | null;
  status: number;
  parcelDetails: string;
  parcelContent: string;
  parcelValuePsw: number;
  chargeExemptCustomerType?: number | null;
  relatedStaffId?: string | null;
  relatedStaffNameSnapshot?: string | null;
  chargePsw: number;
  cardId: string | null;
  cardNumber: string | null;
  secondCardId: string | null;
  secondCardNumber: string | null;
  pickupLocationId: string | null;
  plannedToBePaidPsw: number;
  method: number;
  shelfPickerStaffId: string | null;
  taxReportConfirmation: boolean;
  callSender: boolean;
  isDeleted: boolean;
  deletedBy: string | null;
  deletedAt: Date | null;
  deleteReason: string | null;
  createdBy: string | null;
  processedBy: string | null;
  createdAt: Date;
  receivedBy: string | null;
  receivedAt: Date | null;
  confirmedBy: string | null;
  confirmedAt: Date | null;
  updatedAt: Date;
  cashierSessionId: string | null;
};

export type ListParcelsParams = {
  limit: number;
  offset: number;
  parcelId?: string | null;
  companyId?: string | null;
  ids?: string[] | null;
  sourceId?: string | null;
  destinationId?: string | null;
  scopedBranchId?: string | null;
  locationId?: string | null;
  status?: number | null;
  statuses?: number[] | null;
  riderReturnedOnly?: boolean;
  senderPaid?: boolean | null;
  paymentType?: 'paid' | 'to_be_paid' | 'partial' | null;
  hasPickupQueue?: boolean | null;
  agedOnly?: boolean | null;
  storageChargeAccruing?: boolean | null;
  cashierCollectionRequired?: boolean | null;
  ageThresholdMonths?: number | null;
  storageGraceDays?: number | null;
  storageFeePerDayPsw?: number | null;
  search?: string | null; // bookingCode/trackingCode/sender/receiver names/phones
  received?: boolean | null;
  includeDeleted?: boolean | null;
  assignedToUserId?: string | null;
  callCenterAssignmentOrder?: boolean;
  callCenterUncalledOnly?: boolean;
  shelfPickerAssignmentOrder?: boolean;
  shelfPickerAssigned?: boolean;
  sentDate?: string | null;
  consignmentNumber?: string | null;
  sort?: SortField[] | null;
};
