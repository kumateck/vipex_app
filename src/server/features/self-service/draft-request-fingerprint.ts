import { createHash } from 'node:crypto';
import type { PublicDraftSubmission } from './public-draft.types';

export function fingerprintPublicDraft(input: PublicDraftSubmission) {
  const contact = (value: PublicDraftSubmission['sender']) => ({
    fullname: value.fullname.trim(),
    phone: value.phone.replace(/[()\-\s]/g, ''),
    phone2: value.phone2?.replace(/[()\-\s]/g, '') || null,
    customerId: value.customerId || null,
  });
  return createHash('sha256')
    .update(
      JSON.stringify({
        branchId: input.branchId,
        sender: contact(input.sender),
        receiver: contact(input.receiver),
        destinationBranchId: input.destinationBranchId,
        destinationLocationId: input.destinationLocationId || null,
        parcelContent: input.parcelContent.trim(),
        parcelValueCedis: Number(input.parcelValueCedis),
        termsAccepted: input.termsAccepted,
        termsVersion: input.termsVersion,
      }),
    )
    .digest('hex');
}
