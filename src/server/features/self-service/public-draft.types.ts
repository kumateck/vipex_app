import type { createSelfServiceSessionToken } from './session.service';
export type PublicDraftSubmission = {
  branchId: string;
  sender: { fullname: string; phone: string; phone2?: string | null; customerId?: string | null };
  receiver: {
    fullname: string;
    phone: string;
    phone2?: string | null;
    customerId?: string | null;
  };
  destinationBranchId: string;
  destinationLocationId?: string | null;
  parcelContent: string;
  parcelValueCedis: number | string;
  termsAccepted: boolean;
  termsVersion: string;
  sessionToken: string;
  requestIp?: string | null;
};

export type PublicDraftResult = {
  draftId: string;
  expiresAt: string;
  bookingsCompleted: number;
  nextSession:
    | (Awaited<ReturnType<typeof createSelfServiceSessionToken>> & { branchName: string })
    | null;
};
