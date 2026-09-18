export type StaffOption = {
  id: string;
  fullname: string;
};

export type ParcelRow = {
  id: string;
  bookingCode: string;
  trackingCode: string;
  receiverName: string | null;
  receiverPhone: string | null;
  parcelDetails: string;
  parcelContent: string;
  callCenterAssignedToUserId: string | null;
  callCenterAssignedToUserName: string | null;
  createdAt: string;
};

export const EMPTY_META = {
  total: 0,
  page: 1,
  pageSize: 20,
  pageCount: 0,
};
