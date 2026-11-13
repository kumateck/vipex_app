import type { ParcelHandoverNoteIndicator } from '@/shared/shipments/parcel-handover-note';
import type { ParcelReceivingOffice } from '@/shared/shipments/receiving-office';

export type StaffOption = {
  id: string;
  fullname: string;
};

export type ParcelRow = ParcelHandoverNoteIndicator &
  ParcelReceivingOffice & {
    id: string;
    bookingCode: string;
    trackingCode: string;
    receiverId: string;
    receiverName: string | null;
    receiverPhone: string | null;
    secondReceiverName?: string | null;
    secondReceiverPhone?: string | null;
    parcelDetails: string;
    parcelContent: string;
    chargePsw: number;
    paidPrincipalPsw?: number;
    plannedToBePaidPsw: number;
    status: number;
    pickerStaffId: string | null;
    pickerStaffName: string | null;
    pickupQueueNumber?: number | null;
    createdAt: string;
    receivedAt: string | null;
    storageChargePsw?: number | null;
  };

export const EMPTY_META = {
  total: 0,
  page: 1,
  pageSize: 20,
  pageCount: 0,
};
