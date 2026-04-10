import { PARCEL_STATUS_OPTIONS } from './parcel-status-options';
import type { ParcelBookingFormValues, ParcelFormValues } from './parcel-form.types';
import { sanitizeNumber, sanitizeString } from '@/lib/utils';

export const createEmptyParcel = (): ParcelFormValues => ({
  destinationBranchId: '',
  destinationLocationId: '',
  parcelDetails: '',
  parcelContent: '',
  parcelValue: '0',
  charge: '',
  paymentResponsibility: 'SENDER',
  senderSettlementMode: 'PAY_NOW',
  senderPartialPayment: '',
  receiver: {
    telephone: '',
    telephone2: '',
    customerId: '',
    fullname: '',
  },
});

export const createInitialFormValues = (): ParcelBookingFormValues => ({
  sender: {
    telephone: '',
    telephone2: '',
    customerId: '',
    fullname: '',
  },
  status: PARCEL_STATUS_OPTIONS[0]?.value ?? 0,
  parcels: [createEmptyParcel()],
});

export const parseAmount = (value: string, label: string) => {
  const normalized = sanitizeString(value).replace(/,/g, '').trim();
  if (!normalized) return 0;
  const amount = sanitizeNumber(normalized);
  if (Number.isNaN(amount) || amount < 0) {
    throw new Error(`Enter a valid ${label} amount`);
  }
  return amount;
};

export const isApiRejectionError = (error: unknown): boolean =>
  Boolean(
    error &&
      typeof error === 'object' &&
      ('status' in (error as Record<string, unknown>) ||
        'data' in (error as Record<string, unknown>) ||
        'error' in (error as Record<string, unknown>)),
  );
