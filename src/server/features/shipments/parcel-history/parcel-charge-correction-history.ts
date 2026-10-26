import type { AuditEntry } from './parcel-history-audit';
import type { ParcelHistoryDraft } from './parcel-history.types';
import { asRecord, joinParts, money, paymentMethodLabel, text } from './parcel-history-format';

const TITLES: Record<string, string> = {
  PARCEL_CHARGE_CORRECTION_REQUESTED: 'Charge correction requested',
  PARCEL_ZERO_CHARGE_CORRECTION_APPROVED: 'Charge correction approved and applied',
  PARCEL_CHARGE_CORRECTION_REJECTED: 'Charge correction rejected',
};
/** Build readable, persistent explanations from the immutable before/after audit metadata. */
export function mapChargeCorrectionHistory(entry: AuditEntry): ParcelHistoryDraft[] | null {
  const title = TITLES[entry.action];
  if (!title) return null;
  const meta = asRecord(entry.metadata);
  const approved = entry.action === 'PARCEL_ZERO_CHARGE_CORRECTION_APPROVED';
  const rejected = entry.action === 'PARCEL_CHARGE_CORRECTION_REJECTED';
  const original = paymentMethodLabel(Number(meta.originalMethod));
  return [
    {
      id: `audit:${entry.id}:0`,
      occurredAt: entry.createdAt,
      actorId: entry.actorUserId,
      category: 'edit',
      title,
      subject: text(meta.requestedBy)
        ? { label: 'Requested by', userId: text(meta.requestedBy) }
        : null,
      description: joinParts([
        typeof meta.chargePsw === 'number' &&
          `${approved ? 'Charge' : 'Proposed charge'}: ${money(Number(meta.previousChargePsw ?? 0))} → ${money(meta.chargePsw)}`,
        `${approved ? 'Payment method' : 'Proposed payment method'}: ${original ?? 'Unknown'} → CREDIT`,
        text(meta.customerName) && `Credit account: ${text(meta.customerName)}`,
        text(meta.reason) && `Reason: ${text(meta.reason)}`,
        text(meta.reviewNote) &&
          `${rejected ? 'Rejection reason' : 'Approval note'}: ${text(meta.reviewNote)}`,
        !approved &&
          (rejected
            ? 'Parcel charge and debt were not changed.'
            : 'Awaiting approval; parcel charge and debt are unchanged.'),
        text(meta.requestId) && `Request: ${text(meta.requestId)}`,
      ]),
    },
  ];
}
