import type {
  BatchConfirmation,
  BatchOtpProof,
  BatchOtpRequest,
  BatchOtpSession,
  BatchOtpVerify,
  BatchPickupPage,
} from '@/shared/shipments/parcel-batch-handover';

export type BatchHandoverApi = {
  search: (query: { telephone: string; after?: string }) => Promise<BatchPickupPage>;
  requestOtp: (body: BatchOtpRequest) => Promise<BatchOtpSession>;
  verifyOtp: (body: BatchOtpVerify) => Promise<BatchOtpProof>;
  confirm: (body: BatchConfirmation) => Promise<{ parcelIds: string[]; alreadyConfirmed: boolean }>;
  errorMessage: (error: unknown, fallback: string) => string;
};
