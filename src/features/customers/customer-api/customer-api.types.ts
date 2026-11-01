export enum CustomerType {
  Individual = 0,
  Business = 1,
  Family = 2,
  Friends = 3,
  Director = 4,
  Staff = 5,
}

export interface Customer {
  id: string;
  companyId: string;
  fullname: string;
  telephone?: string;
  telephone2?: string;
  address?: string;
  email?: string;
  customerType: CustomerType;
  creditEligible: boolean;
  creditLimitPsw: number;
  paymentTermsDays: number;
  isNiaVerified: boolean;
  loggedToGovernment: boolean;
  createdAt: string;
}

export interface CustomerFilters {
  customerType?: CustomerType;
  companyId?: string;
  includeDeleted?: boolean | null;
}

export interface CreateCustomerInput {
  fullname: string;
  telephone?: string | null;
  telephone2?: string | null;
  address?: string | null;
  email?: string | null;
  customerType?: CustomerType;
  creditEligible?: boolean;
  creditLimitPsw?: number;
  paymentTermsDays?: number;
  isNiaVerified?: boolean;
  loggedToGovernment?: boolean;
}

export interface UpdateCustomerInput {
  id: string;
  fullname?: string;
  telephone?: string | null;
  telephone2?: string | null;
  address?: string | null;
  email?: string | null;
  customerType?: CustomerType;
  creditEligible?: boolean;
  creditLimitPsw?: number;
  paymentTermsDays?: number;
  isNiaVerified?: boolean;
  loggedToGovernment?: boolean;
}

export interface CustomerCardOption {
  id: string;
  name: string;
}

export interface CustomerCardRecord {
  id: string;
  customerId: string;
  cardId: string;
  cardName: string;
  cardNumber: string;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  createdAt: string;
}

export interface CustomerCreditSummary {
  balancePsw: number;
  balanceCedis: number;
  creditLimitPsw: number;
  availableCreditPsw: number | null;
}

export interface CustomerCreditTransaction {
  id: string;
  companyId: string;
  customerId: string;
  sourceType: number;
  transactionType: number;
  referenceId?: string | null;
  signedAmountPsw: number;
  notes?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CustomerCreditOpenItem {
  chargeTransactionId: string;
  createdAt: string;
  referenceId?: string | null;
  notes?: string | null;
  chargeAmountPsw: number;
  allocatedAmountPsw: number;
  outstandingAmountPsw: number;
}

export interface CustomerTransaction {
  id: string;
  bookingCode: string;
  trackingCode: string;
  sourceId: string;
  destinationId: string;
  status: number;
  chargePsw: number;
  method: number;
  paymentStatus: import('@/shared/shipments/parcel-payment-status').ParcelPaymentStatus;
  paidPrincipalPsw: number;
  creditPaidPsw: number;
  transactionRole: 'SENDER' | 'RECEIVER';
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  source: 'PARCEL_PAYMENT' | 'CREDIT_PAYMENT';
  amountPsw: number;
  method: number | null;
  bookingCode: string | null;
  trackingCode: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CustomerPaymentsMonthly {
  year: number;
  yearTotalPsw: number;
  months: Array<{
    month: number;
    monthLabel: string;
    totalPsw: number;
    parcelPaymentsPsw: number;
    creditPaymentsPsw: number;
  }>;
}

export interface CustomerTransactionsMonthly {
  year: number;
  totalSentCount: number;
  totalReceivedCount: number;
  totalSentAmountPsw: number;
  totalReceivedAmountPsw: number;
  months: Array<{
    month: number;
    monthLabel: string;
    sentCount: number;
    receivedCount: number;
    sentAmountPsw: number;
    receivedAmountPsw: number;
  }>;
}

export interface CustomerStatementRow {
  id: string;
  timestamp: string;
  entryType: 'PARCEL_SENT' | 'PARCEL_RECEIVED' | 'PAYMENT' | 'CREDIT';
  direction: 'debit' | 'credit' | 'info';
  amountPsw: number | null;
  parcelId: string | null;
  bookingCode: string | null;
  trackingCode: string | null;
  method: number | null;
  notes: string;
}

export interface CustomerStatement {
  customer: {
    id: string;
    fullname: string;
    customerType: number;
  };
  range: {
    dateFrom: string | null;
    dateTo: string | null;
  };
  summary: {
    sentParcels: number;
    receivedParcels: number;
    totalSentChargePsw: number;
    totalReceivingToPayPsw: number;
    paymentsMadeByCustomerPsw: number;
    creditChargesPsw: number;
    creditPaymentsPsw: number;
    openingCreditBalancePsw: number;
    closingCreditBalancePsw: number;
  };
  rows: CustomerStatementRow[];
}
