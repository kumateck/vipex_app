import { mobileApiGet, mobileApiPost } from '@mobile/lib/api';
import type { DeliveryChangeDecision, DeliveryChangeReview } from '../types';

export const listPendingDeliveryChangeReviews = (token: string) =>
  mobileApiGet<DeliveryChangeReview[]>({ path: '/deliveries/dd/change-requests/pending', token });

export const decideDeliveryChangeReview = (
  token: string,
  input: { deliveryId: string; decision: DeliveryChangeDecision; reviewNote: string | null },
) =>
  mobileApiPost<{ id: string }>({
    path: `/deliveries/dd/change-requests/${input.deliveryId}/decision`,
    token,
    body: { decision: input.decision, reviewNote: input.reviewNote },
  });
