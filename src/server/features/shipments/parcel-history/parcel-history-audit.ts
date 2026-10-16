import { ParcelStatus } from '@/db/schemas/enums';
import { parcelStatusLabel } from '@/shared/shipments/parcel-status-labels';
import { asRecord, humanize, joinParts, money, text } from './parcel-history-format';
import type { ParcelHistoryDraft } from './parcel-history.types';

export type AuditEntry = {
  id: string;
  entityType: string;
  action: string;
  message: string | null;
  metadata: unknown;
  actorUserId: string | null;
  createdAt: Date;
};

/** Actions whose own table is the history source; their audit rows would repeat them. */
const TABLE_SOURCED_PREFIXES = [
  'PAYMENT_',
  'PARCEL_DISPOSITION_ACTION',
  'PARCEL_STORAGE_',
  'PARCEL_RECONCILIATION_',
  'PARCEL_DISCREPANCY_',
  'PARCEL_INTERNAL_TRANSFER_',
];

/** Patch keys that are bookkeeping rather than something staff changed. */
const IGNORED_PATCH_KEYS = new Set(['id', 'companyId', 'branchId', 'actorUserId', 'updatedAt']);

function describePatch(patch: Record<string, unknown>) {
  const parts = Object.entries(patch)
    .filter(([key, value]) => key !== 'status' && !IGNORED_PATCH_KEYS.has(key) && value != null)
    .map(([key, value]) =>
      key.endsWith('Id') || typeof value === 'object'
        ? `${humanize(key.replace(/Id$/, ''))} changed`
        : `${humanize(key)}: ${String(value).slice(0, 80)}`,
    );
  return joinParts(parts);
}

function draft(entry: AuditEntry, partial: Omit<ParcelHistoryDraft, 'id' | 'occurredAt'>, n = 0) {
  return {
    id: `audit:${entry.id}:${n}`,
    occurredAt: entry.createdAt,
    actorId: entry.actorUserId,
    ...partial,
  } satisfies ParcelHistoryDraft;
}

export function isArrivalAudit(entry: AuditEntry) {
  if (entry.action === 'PARCELS_BULK_RECEIVED') return true;
  const status = asRecord(asRecord(entry.metadata).patch).status;
  return entry.action === 'PARCEL_UPDATED' && status === ParcelStatus.ARRIVED_AT_DESTINATION;
}

export function mapAuditEntry(entry: AuditEntry): ParcelHistoryDraft[] {
  if (TABLE_SOURCED_PREFIXES.some((prefix) => entry.action.startsWith(prefix))) return [];
  const meta = asRecord(entry.metadata);
  const message = text(entry.message);

  switch (entry.action) {
    case 'PARCEL_UPDATED': {
      const patch = asRecord(meta.patch);
      const drafts: ParcelHistoryDraft[] = [];
      if (typeof patch.status === 'number') {
        const previous = asRecord(meta.previous).status;
        drafts.push(
          draft(entry, {
            category: 'status',
            title: `Status changed to ${parcelStatusLabel(patch.status)}`,
            description:
              typeof previous === 'number' && previous !== patch.status
                ? `From ${parcelStatusLabel(previous)}`
                : null,
          }),
        );
      }
      const edits = describePatch(patch);
      if (edits)
        drafts.push(
          draft(entry, { category: 'edit', title: 'Parcel updated', description: edits }, 1),
        );
      return drafts.length
        ? drafts
        : [draft(entry, { category: 'edit', title: message ?? 'Parcel updated' })];
    }
    case 'PARCEL_INFORMATION_UPDATED':
      return [
        draft(entry, {
          category: 'edit',
          title: 'Parcel information edited',
          description: joinParts([
            describePatch(asRecord(meta.patch)),
            text(meta.previousReceiverName) &&
              `Previous receiver: ${text(meta.previousReceiverName)}`,
          ]),
        }),
      ];
    case 'PARCEL_CALL_CENTER_CALLED':
    case 'PARCELS_BULK_CALL_OUTCOME':
      return [
        draft(entry, {
          category: 'communication',
          title:
            entry.action === 'PARCELS_BULK_CALL_OUTCOME'
              ? 'Call outcome recorded (bulk)'
              : 'Customer called by call center',
          description: text(meta.outcome) && `Outcome: ${humanize(String(meta.outcome))}`,
        }),
      ];
    case 'PARCELS_BULK_RECEIVED':
      return [
        draft(entry, {
          category: 'custody',
          title: 'Marked as arrived (bulk receive)',
          branchId: text(meta.branchId),
        }),
      ];
    case 'PARCEL_SHELF_PICKER_ASSIGNED':
    case 'PARCEL_SHELF_PICKER_REASSIGNED':
      return [
        draft(entry, {
          category: 'custody',
          title: entry.action.endsWith('REASSIGNED')
            ? 'Shelf picker reassigned'
            : 'Shelf picker assigned',
          subject: { label: 'Picker', userId: text(meta.pickerStaffId) },
        }),
      ];
    case 'PARCEL_SECOND_RECEIVER_SET':
      return [
        draft(entry, {
          category: 'edit',
          title: 'Second receiver set',
          description: text(meta.telephone) && `Telephone: ${meta.telephone}`,
        }),
      ];
    case 'PARCEL_SECOND_RECEIVER_REMOVED':
      return [
        draft(entry, {
          category: 'edit',
          title: 'Second receiver removed',
          description: text(meta.previousSecondReceiverName),
        }),
      ];
    case 'PARCEL_MAIN_RECEIVER_CHANGED':
      return [
        draft(entry, {
          category: 'edit',
          title: 'Main receiver changed',
          description: text(meta.telephone) && `New telephone: ${meta.telephone}`,
        }),
      ];
    case 'PARCEL_SOFT_DELETED':
      return [
        draft(entry, {
          category: 'edit',
          title: 'Parcel deleted',
          description: text(meta.reason) ? `Reason: ${meta.reason}` : null,
        }),
      ];
    case 'PARCEL_HOME_DELIVERY_REQUESTED':
      return [
        draft(entry, {
          category: 'delivery',
          title: 'Home delivery requested',
          description: message,
        }),
      ];
    case 'PARCEL_DELIVERY_REVERSED':
      return [
        draft(entry, {
          category: 'delivery',
          title: 'Delivery confirmation reversed',
          description: joinParts([
            text(meta.reason) && `Reason: ${meta.reason}`,
            typeof meta.restoredStatus === 'number' &&
              `Status restored to ${parcelStatusLabel(meta.restoredStatus)}`,
          ]),
        }),
      ];
    case 'DELIVERY_CHANGE_REQUESTED':
      return [
        draft(entry, {
          category: 'delivery',
          title: 'Delivery address/fee change requested',
          description: joinParts([
            text(meta.address) && `Address: ${meta.address}`,
            typeof meta.chargePsw === 'number' && `Fee: ${money(meta.chargePsw)}`,
            text(meta.reason) && `Reason: ${meta.reason}`,
          ]),
        }),
      ];
    case 'DELIVERY_FEE_UPDATED':
      return [
        draft(entry, {
          category: 'payment',
          title: 'Delivery fee changed',
          description: joinParts([
            typeof meta.chargePsw === 'number' &&
              `${money(Number(meta.previousChargePsw ?? 0))} → ${money(meta.chargePsw)}`,
            text(meta.reason) && `Reason: ${meta.reason}`,
          ]),
        }),
      ];
    case 'CALL_CENTER_NOTIFICATION_SENT':
      return [
        draft(entry, {
          category: 'communication',
          title: 'Customer notification sent',
          description: joinParts([
            meta.sendSms === true && 'SMS',
            meta.sendEmail === true && 'Email',
            typeof meta.failedCount === 'number' &&
              meta.failedCount > 0 &&
              `${meta.failedCount} failed`,
          ]),
        }),
      ];
    default:
      return [
        draft(entry, {
          category:
            entry.entityType === 'delivery'
              ? 'delivery'
              : entry.entityType === 'notification_dispatch'
                ? 'communication'
                : 'edit',
          title: message ?? humanize(entry.action),
          description: joinParts([
            text(meta.reviewNote) && `Note: ${meta.reviewNote}`,
            text(meta.reason) && `Reason: ${meta.reason}`,
          ]),
        }),
      ];
  }
}
