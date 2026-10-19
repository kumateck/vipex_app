import { describe, expect, test } from 'bun:test';
import { buildSelfServiceCompletionReceipt } from './index';
import type {
  CompleteSelfServiceDraftInput,
  SelfServiceDraft,
} from '../api/self-service-agent.api';

const draft: SelfServiceDraft = {
  id: 'draft',
  companyId: 'company',
  branchId: 'source',
  status: 1,
  senderFullname: 'Corrected sender',
  senderPhone: '0240000000',
  senderPhone2: '0241111111',
  receiverFullname: 'Corrected receiver',
  receiverPhone: '0550000000',
  receiverPhone2: '0551111111',
  destinationBranchId: 'original-destination',
  destinationLocationId: null,
  parcelContent: 'Customer contents',
  parcelValuePsw: 10000,
  callSender: true,
  termsVersion: null,
  termsAcceptedAt: null,
  expiresAt: '',
  claimedBy: 'officer',
  claimedAt: '',
  createdAt: '',
  updatedAt: '',
};
const input: CompleteSelfServiceDraftInput = {
  id: 'draft',
  destinationId: 'corrected-destination',
  pickupLocationId: 'location',
  parcelDetails: 'Officer: 1 sealed carton',
  chargeCedis: '50',
  paymentResponsibility: 'SPLIT',
  senderSettlementMode: 'PAY_NOW',
  senderPartialPaymentCedis: '20',
  callSender: false,
};
const args = {
  draft,
  input,
  response: {
    bookingId: 'saved-booking',
    parcels: [{ id: 'saved-parcel', bookingCode: 'BOOK-1', trackingCode: 'TRACK-1' }],
  },
  destinationBranchName: 'Kumasi',
  destinationLocationName: 'Asafo',
};

describe('completed self-service sticker data', () => {
  test('keeps officer details separate from customer contents and uses saved identifiers', () => {
    expect(buildSelfServiceCompletionReceipt(args)).toMatchObject({
      bookingCode: 'BOOK-1',
      trackingCode: 'TRACK-1',
      parcelDetails: input.parcelDetails,
      parcelContent: draft.parcelContent,
      senderName: draft.senderFullname,
      senderTelephone2: draft.senderPhone2,
      receiverName: draft.receiverFullname,
      receiverTelephone2: draft.receiverPhone2,
      destinationBranchName: 'Kumasi',
      destinationLocationName: 'Asafo',
      callSender: false,
      senderPaidCedis: 0,
      receiverToPayCedis: 30,
      stickerStatusLabel: 'PENDING',
    });
  });

  test('never treats sender pay-now completion as payment collection', () => {
    expect(
      buildSelfServiceCompletionReceipt({
        ...args,
        input: { ...input, paymentResponsibility: 'SENDER' },
      }),
    ).toMatchObject({
      senderPaidCedis: 0,
      receiverToPayCedis: 0,
      stickerStatusLabel: 'PENDING',
    });
  });

  test('does not invent print identifiers if the completion response has no parcel', () => {
    expect(
      buildSelfServiceCompletionReceipt({
        ...args,
        response: { bookingId: 'saved-booking', parcels: [] },
      }),
    ).toBeNull();
  });
});
