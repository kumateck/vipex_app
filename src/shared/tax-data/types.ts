export type TaxDataFilters = {
  date: string;
  branchId?: string;
  destinationBranchId?: string;
  amountPsw?: number;
  maxOccurrences?: number;
  confirmation: 'all' | 'confirmed' | 'unconfirmed';
};
export type TaxDataBranchOptions = {
  fromBranches: Array<{ id: string; name: string }>;
  toBranches: Array<{ id: string; name: string }>;
};
export type TaxDataAmounts = {
  paidPrincipalPsw: number;
  netPsw: number;
  vatPsw: number;
  getfundPsw: number;
  nhilPsw: number;
  covidPsw: number;
  otherTaxPsw: number;
  taxTotalPsw: number;
};
export type TaxDataRow = TaxDataAmounts & {
  parcelId: string;
  version: string;
  bookingCode: string;
  trackingCode: string;
  bookedOn: string;
  sourceBranchName: string;
  destinationBranchName: string;
  senderName: string;
  senderTelephone: string;
  receiverName: string;
  receiverTelephone: string;
  parcelDetails: string;
  parcelContent: string;
  parcelValuePsw: number;
  paymentCount: number;
  confirmed: boolean;
};
export type TaxDataCounts = {
  filters: TaxDataFilters;
  generatedAt: string;
  groups: Array<{ amountPsw: number; parcels: number }>;
  totals: TaxDataAmounts & { parcels: number };
};
export type TaxDataRecords = {
  filters: TaxDataFilters;
  rows: TaxDataRow[];
  page: number;
  limit: number;
  hasMore: boolean;
};
export type TaxDataSelection = { parcelId: string; version: string };
export type TaxDataConfirmation = {
  confirmed: number;
  alreadyConfirmed: number;
  rows: TaxDataRow[];
};
