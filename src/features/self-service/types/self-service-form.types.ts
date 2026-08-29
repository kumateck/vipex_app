import type { Path } from 'react-hook-form';

export type SelfServiceContactFormValues = {
  fullname: string;
  phone: string;
  phone2: string;
  // Hidden: set only when the phone lookup finds an exact existing-customer
  // match. Never rendered - carried through to submission so the agent-side
  // completion can attach the exact customer record.
  customerId: string;
};

export type SelfServiceBookingFormValues = {
  sender: SelfServiceContactFormValues;
  receiver: SelfServiceContactFormValues;
  destinationBranchId: string;
  destinationLocationId: string;
  parcelContent: string;
  parcelValue: string;
  callSender: boolean;
  acceptedTerms: boolean;
};

export const createInitialSelfServiceFormValues = (): SelfServiceBookingFormValues => ({
  sender: { fullname: '', phone: '', phone2: '', customerId: '' },
  receiver: { fullname: '', phone: '', phone2: '', customerId: '' },
  destinationBranchId: '',
  destinationLocationId: '',
  parcelContent: '',
  parcelValue: '',
  callSender: false,
  acceptedTerms: false,
});

export const SELF_SERVICE_STAGES = [
  'sender',
  'receiver',
  'destination',
  'parcel',
  'review',
] as const;

export type SelfServiceStage = (typeof SELF_SERVICE_STAGES)[number];

export const SELF_SERVICE_STAGE_LABELS: Record<SelfServiceStage, string> = {
  sender: 'Sender',
  receiver: 'Receiver',
  destination: 'Destination',
  parcel: 'Parcel',
  review: 'Review',
};

export const SELF_SERVICE_STAGE_FIELDS: Record<
  SelfServiceStage,
  Path<SelfServiceBookingFormValues>[]
> = {
  sender: ['sender.phone', 'sender.fullname', 'sender.phone2'],
  receiver: ['receiver.phone', 'receiver.fullname', 'receiver.phone2'],
  destination: ['destinationBranchId', 'destinationLocationId'],
  parcel: ['parcelContent', 'parcelValue'],
  review: ['acceptedTerms'],
};
