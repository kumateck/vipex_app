import { BadRequest, Conflict } from '@/server/utils/http-error';

export function assertNoOutstandingStorageForHandover(outstandingPsw: number) {
  if (outstandingPsw > 0) {
    throw Conflict(
      `Storage accrual must be settled or waived before handover. Outstanding storage: ${(outstandingPsw / 100).toFixed(2)} GHS`,
    );
  }
}

export function assertValidStorageCollectionAmount(input: {
  outstandingPsw: number;
  collectionPsw: number;
}) {
  if (input.outstandingPsw <= 0) {
    throw Conflict('No outstanding storage accrual to collect');
  }
  if (!Number.isFinite(input.collectionPsw) || input.collectionPsw <= 0) {
    throw BadRequest('Storage payment amount must be greater than 0');
  }
  if (input.collectionPsw > input.outstandingPsw) {
    throw Conflict(
      `Storage payment exceeds outstanding accrual. Outstanding storage is ${(input.outstandingPsw / 100).toFixed(2)} GHS`,
    );
  }
}

export function validateStorageWaiverReason(reason: string) {
  const normalized = reason.trim();
  if (!normalized) throw BadRequest('Waiver reason is required');
  return normalized;
}

export function resolveAndValidateStorageWaiverAmountPsw(input: {
  outstandingPsw: number;
  requestedPsw?: number | null;
}) {
  if (input.outstandingPsw <= 0) {
    throw Conflict('No outstanding storage accrual to waive');
  }

  const waivedPsw = input.requestedPsw ?? input.outstandingPsw;
  if (!Number.isFinite(waivedPsw) || waivedPsw <= 0) {
    throw BadRequest('Waived amount must be greater than 0');
  }
  if (waivedPsw > input.outstandingPsw) {
    throw Conflict(
      `Waived amount cannot exceed outstanding storage accrual (${(input.outstandingPsw / 100).toFixed(2)} GHS)`,
    );
  }

  return waivedPsw;
}
