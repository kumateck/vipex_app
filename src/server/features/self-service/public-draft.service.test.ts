import { describe, expect, test } from 'bun:test';
import { SELF_SERVICE_TERMS_VERSION } from '@/shared/self-service/terms';
import { submitSelfServiceDraftSvc } from './public-draft.service';

const baseInput = {
  branchId: 'branch-id',
  sender: { fullname: 'Sender', phone: '0200000000' },
  receiver: { fullname: 'Receiver', phone: '0200000001' },
  destinationBranchId: 'destination-id',
  parcelContent: 'Books',
  parcelValueCedis: 50,
  callSender: false,
  sessionToken: 'session-token',
};

describe('submitSelfServiceDraftSvc terms enforcement', () => {
  test.each([
    { termsAccepted: false, termsVersion: SELF_SERVICE_TERMS_VERSION },
    { termsAccepted: true, termsVersion: 'outdated' },
  ])('rejects false or outdated consent before processing a draft', async (consent) => {
    await expect(submitSelfServiceDraftSvc({ ...baseInput, ...consent })).rejects.toThrow(
      'You must accept the current Terms & Conditions before submitting',
    );
  });
});
