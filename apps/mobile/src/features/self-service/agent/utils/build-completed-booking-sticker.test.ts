import { describe, expect, test } from 'bun:test';
import { buildCompletedBookingSticker } from './build-completed-booking-sticker';
import type { CompletedSelfServiceBooking } from '../types';

const completed: CompletedSelfServiceBooking = {
  draft: {
    id: 'draft',
    branchId: 'source',
    status: 1,
    senderFullname: 'Corrected sender',
    senderPhone: '0240000000',
    senderPhone2: '0241111111',
    receiverFullname: 'Corrected receiver',
    receiverPhone: '0550000000',
    receiverPhone2: '0551111111',
    destinationBranchId: 'destination',
    destinationLocationId: 'location',
    parcelContent: 'Books',
    parcelValuePsw: 10000,
    callSender: false,
    expiresAt: '',
    claimedBy: 'officer',
    claimedAt: '',
    createdAt: '',
    updatedAt: '',
  },
  input: {
    id: 'draft',
    destinationId: 'destination',
    pickupLocationId: 'location',
    parcelDetails: '1 sealed carton',
    chargeCedis: '50',
    paymentResponsibility: 'RECEIVER',
    senderSettlementMode: 'PAY_NOW',
    senderPartialPaymentCedis: null,
    callSender: true,
  },
  result: {
    bookingId: 'saved-booking',
    parcels: [{ id: 'parcel', bookingCode: 'BOOK-1', trackingCode: 'TRACK-1' }],
  },
};

describe('mobile completed self-service sticker', () => {
  test('prints the saved booking with officer details, corrected contacts and chosen quantity', () => {
    const sticker = buildCompletedBookingSticker(completed, 'Kumasi', 'Asafo', 25);
    expect(sticker).toMatchObject({
      bookingCode: 'BOOK-1',
      trackingCode: 'TRACK-1',
      parcelDetails: '1 sealed carton',
      senderName: 'Corrected sender',
      senderPhone: '0240000000 / 0241111111',
      receiverName: 'Corrected receiver',
      receiverPhone: '0550000000 / 0551111111',
      destinationBranch: 'Kumasi',
      destinationLocation: 'Asafo',
      copies: 25,
      amountCedis: 50,
      callSender: true,
    });
    expect(sticker?.parcelDetails).not.toBe(completed.draft.parcelContent);
  });

  test('retains saved identifiers for another print attempt', () => {
    const first = buildCompletedBookingSticker(completed, 'Kumasi', 'Asafo', 1);
    const retry = buildCompletedBookingSticker(completed, 'Kumasi', 'Asafo', 2);
    expect(retry?.trackingCode).toBe(first?.trackingCode);
    expect(retry?.bookingCode).toBe(first?.bookingCode);
    expect(retry?.copies).toBe(2);
  });
});
