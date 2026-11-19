import { mobileApiGet, mobileApiPost } from '@mobile/lib/api';
import type { BatchSignaturePage } from '@/shared/shipments/batch-signature-request';

export function listBatchSignatures(token: string, query: { search: string; after?: string }) {
  return mobileApiGet<BatchSignaturePage>({
    path: '/payments/batch-handover-signatures',
    token,
    query,
  });
}

export function saveBatchSignature(
  token: string,
  id: string,
  requestId: string,
  signatureImage: string,
) {
  return mobileApiPost<{ signedAt: string }>({
    path: `/payments/batch-handover-signatures/${id}/signature`,
    token,
    body: { requestId, signature: { source: 'touchscreen', signatureImage } },
  });
}
