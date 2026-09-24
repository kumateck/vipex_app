export type StaffOption = {
  id: string;
  fullname: string;
};

export type ParcelRow = {
  id: string;
  bookingCode: string;
  trackingCode: string;
  receiverId: string;
  receiverName: string | null;
  receiverPhone: string | null;
  parcelDetails: string;
  parcelContent: string;
  chargePsw: number;
  paidPrincipalPsw?: number;
  plannedToBePaidPsw: number;
  status: number;
  pickerStaffId: string | null;
  pickerStaffName: string | null;
  createdAt: string;
  receivedAt: string | null;
};

export const EMPTY_META = {
  total: 0,
  page: 1,
  pageSize: 20,
  pageCount: 0,
};
