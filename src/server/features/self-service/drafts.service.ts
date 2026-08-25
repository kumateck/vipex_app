import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import { fromPesewas } from '@/server/utils/gh-money';
import { findOrCreateCustomerSvc } from '@/server/features/customers/service';
import {
  createBookingWithParcelsSvc,
  type CreateBookingWithParcelsBody,
} from '@/server/features/shipments/booking-with-parcels.service';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import {
  ParcelStatus,
  PaymentMethod,
  PaymentResponsibility,
  SelfServiceDraftStatus,
} from '@/db/schemas/enums';
import type { AuthUser } from '@/server/plugins/auth';
import {
  cancelSelfServiceDraftRepo,
  claimSelfServiceDraftRepo,
  deleteExpiredSelfServiceDraftsRepo,
  getSelfServiceDraftRepo,
  listSelfServiceDraftsForBranchRepo,
  markSelfServiceDraftCompletedRepo,
} from './drafts.repository';

export async function listSelfServiceDraftsSvc(agentUser: AuthUser) {
  if (!agentUser.companyId || !agentUser.branchId) throw Forbidden('Branch context is required');
  await deleteExpiredSelfServiceDraftsRepo();
  return listSelfServiceDraftsForBranchRepo({
    companyId: agentUser.companyId,
    branchId: agentUser.branchId,
    statuses: [SelfServiceDraftStatus.PENDING, SelfServiceDraftStatus.CLAIMED],
  });
}

async function getOwnedDraft(id: string, agentUser: AuthUser) {
  if (!agentUser.companyId || !agentUser.branchId) throw Forbidden('Branch context is required');
  const draft = await getSelfServiceDraftRepo(id, agentUser.companyId);
  if (!draft) throw NotFound('Draft not found');
  if (draft.branchId !== agentUser.branchId) throw Forbidden('Draft belongs to a different branch');
  if (draft.expiresAt.getTime() < Date.now() && draft.status !== SelfServiceDraftStatus.COMPLETED) {
    throw NotFound('This draft has expired and was removed');
  }
  return draft;
}

export async function getSelfServiceDraftSvc(id: string, agentUser: AuthUser) {
  return getOwnedDraft(id, agentUser);
}

export async function claimSelfServiceDraftSvc(id: string, agentUser: AuthUser) {
  await getOwnedDraft(id, agentUser);
  const claimed = await claimSelfServiceDraftRepo({
    id,
    companyId: agentUser.companyId!,
    claimedBy: agentUser.sub,
  });
  if (!claimed) throw Conflict('This draft was already claimed or completed by someone else');
  return claimed;
}

export type CompleteSelfServiceDraftInput = {
  destinationId: string;
  pickupLocationId?: string | null;
  parcelDetails: string;
  chargeCedis: number | string;
  paymentResponsibility: 'SENDER' | 'RECEIVER' | 'SPLIT';
  senderSettlementMode: 'PAY_NOW' | 'CREDIT';
  senderPartialPaymentCedis?: number | string | null;
};

export async function completeSelfServiceDraftSvc(
  id: string,
  agentInput: CompleteSelfServiceDraftInput,
  agentUser: AuthUser,
) {
  const draft = await getOwnedDraft(id, agentUser);
  if (
    draft.status !== SelfServiceDraftStatus.PENDING &&
    draft.status !== SelfServiceDraftStatus.CLAIMED
  ) {
    throw Conflict('Draft is not in a completable state');
  }
  if (draft.branchId === agentInput.destinationId) {
    throw BadRequest('Destination branch cannot be the same as the source branch');
  }

  // A customerId already on the draft means the customer-facing phone lookup
  // found an exact match at submission time - attach that record directly
  // rather than re-resolving by phone (avoids a second lookup and any drift
  // between submission and completion).
  const [senderId, receiverId] = await Promise.all([
    draft.senderCustomerId ??
      findOrCreateCustomerSvc({
        companyId: agentUser.companyId!,
        fullname: draft.senderFullname,
        telephone: draft.senderPhone,
        telephone2: draft.senderPhone2,
        createdBy: agentUser.sub,
      }).then((c) => c.id),
    draft.receiverCustomerId ??
      findOrCreateCustomerSvc({
        companyId: agentUser.companyId!,
        fullname: draft.receiverFullname,
        telephone: draft.receiverPhone,
        telephone2: draft.receiverPhone2,
        createdBy: agentUser.sub,
      }).then((c) => c.id),
  ]);

  const chargeCedis = Number(agentInput.chargeCedis);
  const partialCedis = Number(agentInput.senderPartialPaymentCedis ?? 0);
  const plannedToBePaidCedis =
    agentInput.paymentResponsibility === 'RECEIVER'
      ? chargeCedis
      : agentInput.paymentResponsibility === 'SPLIT'
        ? Math.max(chargeCedis - partialCedis, 0)
        : 0;

  const chargeValidationError = getParcelChargeValidationError({
    chargeCedis,
    plannedToBePaidCedis,
  });
  if (chargeValidationError) throw BadRequest(chargeValidationError);

  const paymentResponsibility =
    agentInput.paymentResponsibility === 'SENDER'
      ? PaymentResponsibility.SENDER
      : agentInput.paymentResponsibility === 'RECEIVER'
        ? PaymentResponsibility.RECIPIENT
        : PaymentResponsibility.SPLIT;

  const method =
    agentInput.paymentResponsibility === 'SENDER' && agentInput.senderSettlementMode === 'CREDIT'
      ? PaymentMethod.CREDIT
      : PaymentMethod.CASH;

  const body: CreateBookingWithParcelsBody = {
    senderId,
    companyId: agentUser.companyId!,
    sourceId: draft.branchId,
    sourceLocationId: agentUser.locationId ?? null,
    status: ParcelStatus.CREATED,
    createdBy: agentUser.sub,
    requireActiveCashierSession: false,
    parcels: [
      {
        destinationId: agentInput.destinationId,
        pickupLocationId: agentInput.pickupLocationId ?? null,
        receiverId,
        status: ParcelStatus.CREATED,
        parcelDetails: agentInput.parcelDetails,
        parcelContent: draft.parcelContent,
        parcelValueCedis: fromPesewas(BigInt(draft.parcelValuePsw)),
        chargeCedis,
        plannedToBePaidCedis,
        method,
        senderPaymentCedis: 0,
        paymentResponsibility,
        cashierUserId: agentUser.sub,
        branchId: draft.branchId,
        callSender: draft.callSender,
      },
    ],
  };

  const created = await createBookingWithParcelsSvc(body);
  const parcel = created.parcels[0];
  if (!parcel) throw Conflict('Failed to create parcel from draft');

  await markSelfServiceDraftCompletedRepo({
    id: draft.id,
    completedBy: agentUser.sub,
    bookingId: created.bookingId,
    parcelId: parcel.id,
  });

  return created;
}

export async function cancelSelfServiceDraftSvc(id: string, reason: string, agentUser: AuthUser) {
  await getOwnedDraft(id, agentUser);
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw BadRequest('Cancellation reason is required');
  const cancelled = await cancelSelfServiceDraftRepo({
    id,
    companyId: agentUser.companyId!,
    cancelledBy: agentUser.sub,
    reason: trimmedReason,
  });
  if (!cancelled) throw NotFound('Draft not found');
  return cancelled;
}

export async function sweepExpiredSelfServiceDraftsSvc(): Promise<number> {
  return deleteExpiredSelfServiceDraftsRepo();
}
