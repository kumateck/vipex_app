export const ChargeCorrectionStatus = { Pending: 0, Approved: 1, Rejected: 2 } as const;
export type ChargeCorrection = {
  id: string;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  customerName: string;
  chargePsw: number;
  originalMethod: number;
  reason: string;
  status: number;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
};
