export type CorrectionParty = 'sender' | 'receiver' | 'secondReceiver';
export type CorrectionMode = 'profile' | 'relink';

export type CorrectionCustomer = {
  id: string;
  fullname: string;
  telephone: string | null;
  telephone2: string | null;
  version: string;
};

export type CorrectionParcel = {
  id: string;
  bookingCode: string;
  trackingCode: string;
  status: number;
  version: string;
  restriction: string | null;
  parties: Partial<Record<CorrectionParty, CorrectionCustomer & { recordedName: string }>>;
};

export type CustomerCorrectionInput = {
  parcelId: string;
  expectedVersion: string;
  expectedCustomerVersion: string;
  party: CorrectionParty;
  mode: CorrectionMode;
  fullname: string;
  updateName: boolean;
  telephone: string;
  telephone2: string | null;
  customerId?: string;
  replacementVersion?: string;
  reason: string;
};
