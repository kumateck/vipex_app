export type StaffOption = {
  id: string;
  fullname: string;
};

export type ParcelRow = {
  id: string;
  bookingCode: string;
  trackingCode: string;
  senderName: string | null;
  senderPhone: string | null;
  senderPhone2: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverPhone2: string | null;
  parcelDetails: string;
  parcelContent: string;
  chargePsw: number;
  paidPrincipalPsw?: number;
  plannedToBePaidPsw: number;
  callCenterAssignedToUserId: string | null;
  callCenterAssignedToUserName: string | null;
  createdAt: string;
  receivedAt: string | null;
};

export const EMPTY_META = {
  total: 0,
  page: 1,
  pageSize: 20,
  pageCount: 0,
};
