import { describe, expect, it } from 'bun:test';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { confirmReceiverDelivery } from './confirm-receiver-delivery';

const PARCEL = {
  id: 'parcel-1',
  receiverId: 'receiver-1',
  receiverName: 'Receiver',
  chargePsw: 3_000,
  bookingCode: 'BOOK-1',
  trackingCode: 'TRACK-1',
  parcelDetails: 'Box',
  parcelContent: 'Documents',
} as ParcelSearchRow;

describe('confirmReceiverDelivery branch OTP policy', () => {
  it('allows an approved branch bypass without sending an OTP token', async () => {
    let submittedToken: string | undefined = 'not-called';
    await confirmReceiverDelivery({
      selectedParcel: PARCEL,
      pickerStaffId: 'staff-1',
      paymentAmount: '0',
      storagePaymentAmount: '0',
      receiverDuePsw: 0,
      storageOutstandingPsw: 0,
      canWaiveStorageAccrual: false,
      handoverTarget: 'main',
      mainCardMode: 'none',
      mainExistingCardRecordId: '',
      mainNewCardTypeId: '',
      mainNewCardNumber: '',
      mainReceiverCards: [],
      secondCardMode: 'none',
      secondExistingCardRecordId: '',
      secondNewCardTypeId: '',
      secondNewCardNumber: '',
      secondNewName: '',
      secondNewPhone: '',
      secondReceiverCards: [],
      paymentMethod: '0',
      destinationBranchName: 'Accra',
      destinationLocationName: 'Front desk',
      isReceiverOtpRequired: false,
      receiverOtpVerificationToken: '',
      addCustomerCard: async () => undefined,
      createCustomer: async () => ({ id: 'customer-2' }),
      collectReceiverAndDeliver: async (input) => {
        submittedToken = input.receiverOtpVerificationToken;
        return { payment: null };
      },
    });

    expect(submittedToken).toBeUndefined();
  });

  it('still blocks handover when the branch requires OTP', async () => {
    expect(
      confirmReceiverDelivery({
        selectedParcel: PARCEL,
        pickerStaffId: 'staff-1',
        paymentAmount: '0',
        storagePaymentAmount: '0',
        receiverDuePsw: 0,
        storageOutstandingPsw: 0,
        canWaiveStorageAccrual: false,
        handoverTarget: 'main',
        mainCardMode: 'none',
        mainExistingCardRecordId: '',
        mainNewCardTypeId: '',
        mainNewCardNumber: '',
        mainReceiverCards: [],
        secondCardMode: 'none',
        secondExistingCardRecordId: '',
        secondNewCardTypeId: '',
        secondNewCardNumber: '',
        secondNewName: '',
        secondNewPhone: '',
        secondReceiverCards: [],
        paymentMethod: '0',
        destinationBranchName: 'Accra',
        destinationLocationName: 'Front desk',
        isReceiverOtpRequired: true,
        receiverOtpVerificationToken: '',
        addCustomerCard: async () => undefined,
        createCustomer: async () => ({ id: 'customer-2' }),
        collectReceiverAndDeliver: async () => ({ payment: null }),
      }),
    ).rejects.toThrow('Verify the receiver OTP');
  });

  it('prints a storage-only receipt with combined-amount receipt tax', async () => {
    const { receipt } = await confirmReceiverDelivery({
      selectedParcel: PARCEL,
      pickerStaffId: 'staff-1',
      paymentAmount: '0',
      storagePaymentAmount: '6',
      receiverDuePsw: 0,
      storageOutstandingPsw: 600,
      canWaiveStorageAccrual: false,
      handoverTarget: 'main',
      mainCardMode: 'none',
      mainExistingCardRecordId: '',
      mainNewCardTypeId: '',
      mainNewCardNumber: '',
      mainReceiverCards: [],
      secondCardMode: 'none',
      secondExistingCardRecordId: '',
      secondNewCardTypeId: '',
      secondNewCardNumber: '',
      secondNewName: '',
      secondNewPhone: '',
      secondReceiverCards: [],
      paymentMethod: '0',
      destinationBranchName: 'Accra',
      destinationLocationName: 'Front desk',
      isReceiverOtpRequired: false,
      receiverOtpVerificationToken: '',
      addCustomerCard: async () => undefined,
      createCustomer: async () => ({ id: 'customer-2' }),
      collectReceiverAndDeliver: async (input) => {
        expect(input.storageAmountCedis).toBe(6);
        return {
          payment: null,
          storagePayment: { amounts: { grossCedis: 6 } },
          receiptTaxBreakdown: {
            vatCedis: 0.5,
            getfundCedis: 0,
            nhilCedis: 0,
            covidCedis: 0,
            taxTotalCedis: 0.5,
          },
        };
      },
    });
    expect(receipt.amountPaidCedis).toBe(6);
    expect(receipt.storageChargeCedis).toBe(6);
    expect(receipt.taxBreakdown?.taxTotalCedis).toBe(0.5);
  });
});
