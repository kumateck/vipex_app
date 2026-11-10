import { mobileApiGet, mobileApiPost } from '@mobile/lib/api';
import type {
  PendingReceiverHandoverRow,
  ReceiverHandoverListQuery,
  ReceiverHandoverPage,
} from '../types';

export function watchReceiverSignatures(token: string, query: ReceiverHandoverListQuery) {
  return mobileApiGet<ReceiverHandoverPage>({ path: '/payments/receiver-handovers', token, query });
}

export function saveReceiverSignature(
  token: string,
  row: PendingReceiverHandoverRow,
  signatureImage: string,
) {
  return mobileApiPost<{ id: string; signedAt: string }>({
    path: `/payments/receiver-handovers/${row.id}/signature`,
    token,
    body: { handoverId: row.handoverId, signature: { source: 'touchscreen', signatureImage } },
  });
}
