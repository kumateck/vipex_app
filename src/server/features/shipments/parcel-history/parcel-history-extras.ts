import { ParcelReconciliationCaseStatus } from '@/db/schemas/enums';
import {
  caseActionLabel,
  caseTypeLabel,
  dispositionLabel,
  humanize,
  joinParts,
  maskPhone,
  money,
} from './parcel-history-format';
import type { ParcelHistoryDraft } from './parcel-history.types';
import type * as Repo from './parcel-history-extras.repository';

type Rows<K extends keyof typeof Repo> = Awaited<ReturnType<(typeof Repo)[K]>>;
type Draft = ParcelHistoryDraft;
type Step = [key: string, at: Date | null, draft: Omit<Draft, 'id' | 'occurredAt' | 'category'>];

function steps(prefix: string, category: Draft['category'], list: Step[]): Draft[] {
  return list
    .filter((step): step is [string, Date, Step[2]] => step[1] instanceof Date)
    .map(([key, at, draft]) => ({ id: `${prefix}:${key}`, occurredAt: at, category, ...draft }));
}

export function mapPickupQueues(rows: Rows<'listParcelPickupQueueEventsRepo'>) {
  return rows.flatMap((row) =>
    steps(`queue:${row.id}`, 'custody', [
      [
        'queued',
        row.queuedAt,
        {
          title: `Added to pickup queue ${row.queueCode}`,
          description: `Ticket ${row.queueNumber}`,
          actorId: row.queuedBy,
          branchId: row.branchId,
          subject: { label: 'Picker', userId: row.pickerStaffId },
        },
      ],
      [
        'ended',
        row.endedAt,
        {
          title: `Pickup queue ticket ${row.queueCode} closed`,
          actorId: row.endedBy,
          branchId: row.branchId,
        },
      ],
    ]),
  );
}

export function mapTransfers(rows: Rows<'listParcelTransferEventsRepo'>) {
  return rows.flatMap((row) => {
    const route = `${row.fromName ?? row.fromWarehouseName ?? 'branch'} → ${row.toName ?? row.toWarehouseName ?? 'branch'}`;
    return steps(`transfer:${row.id}`, 'custody', [
      [
        'sent',
        row.transferredAt,
        {
          title: `Internal transfer ${row.referenceNo} sent`,
          description: joinParts([route, row.notes]),
          actorId: row.transferredBy,
          branchId: row.branchId,
        },
      ],
      [
        'acknowledged',
        row.acknowledgedAt,
        {
          title: `Internal transfer ${row.referenceNo} acknowledged`,
          description: route,
          actorId: row.acknowledgedBy,
          branchId: row.branchId,
        },
      ],
      [
        'cancelled',
        row.cancelledAt,
        {
          title: `Internal transfer ${row.referenceNo} cancelled`,
          description: row.cancelReason && `Reason: ${row.cancelReason}`,
          actorId: row.cancelledBy,
          branchId: row.branchId,
        },
      ],
    ]);
  });
}

export function mapOtps(rows: Rows<'listParcelOtpEventsRepo'>) {
  return rows.flatMap((row) =>
    steps(`otp:${row.id}`, 'communication', [
      [
        'sent',
        row.createdAt,
        {
          title: 'Pickup OTP sent',
          description: joinParts([humanize(row.targetReceiver), maskPhone(row.phone)]),
          actorId: row.createdBy,
          branchId: row.branchId,
        },
      ],
      ['verified', row.verifiedAt, { title: 'Pickup OTP verified', branchId: row.branchId }],
    ]),
  );
}

export function mapStickerPrints(rows: Rows<'listParcelStickerPrintEventsRepo'>) {
  return rows.flatMap((row) =>
    steps(`sticker:${row.id}`, 'print', [
      [
        'printed',
        row.printedAt,
        {
          title: 'Sticker printed',
          description: row.copies > 1 ? `${row.copies} copies` : null,
          actorId: row.printedBy,
          branchId: row.branchId,
        },
      ],
    ]),
  );
}

export function mapDiscrepancies(rows: Rows<'listParcelDiscrepancyEventsRepo'>) {
  return rows.flatMap((row) =>
    steps(`discrepancy:${row.id}`, 'exception', [
      [
        'logged',
        row.createdAt,
        {
          title: `Discrepancy logged: ${humanize(row.discrepancyType)}`,
          description: row.notes,
          actorId: row.createdBy,
          branchId: row.branchId,
        },
      ],
      [
        'resolved',
        row.resolvedAt,
        {
          title: 'Discrepancy resolved',
          description: row.resolutionNote,
          actorId: row.resolvedBy,
          branchId: row.branchId,
        },
      ],
    ]),
  );
}

export function mapReconciliationCases(rows: Rows<'listParcelReconciliationEventsRepo'>) {
  return rows.flatMap((row) => {
    const what = joinParts([caseTypeLabel(row.caseType), caseActionLabel(row.actionType)]);
    return steps(`case:${row.id}`, 'exception', [
      [
        'requested',
        row.requestedAt,
        {
          title: 'Reconciliation case requested',
          description: joinParts([what, row.notes]),
          actorId: row.requestedBy,
        },
      ],
      [
        'approved',
        row.approvedAt,
        { title: 'Reconciliation case approved', description: what, actorId: row.approvedBy },
      ],
      [
        'executed',
        row.executedAt,
        {
          title: 'Reconciliation case executed',
          description: joinParts([what, row.resolutionNote]),
          actorId: row.executedBy,
        },
      ],
      [
        'rejected',
        row.status === ParcelReconciliationCaseStatus.REJECTED ? row.updatedAt : null,
        { title: 'Reconciliation case rejected', description: row.resolutionNote },
      ],
    ]);
  });
}

export function mapStorageWaivers(rows: Rows<'listParcelStorageWaiverEventsRepo'>) {
  return rows.flatMap((row) =>
    steps(`waiver:${row.id}`, 'storage', [
      [
        'waived',
        row.waivedAt,
        {
          title: `Storage fee waived ${money(row.waivedAmountPsw)}`,
          description: `Reason: ${row.reason}`,
          actorId: row.waivedBy,
        },
      ],
    ]),
  );
}

export function mapClearances(rows: Rows<'listParcelClearanceEventsRepo'>) {
  return rows.flatMap((row) => {
    const amount = row.clearAll ? 'all accrued storage' : money(row.requestedAmountPsw);
    return steps(`clearance:${row.id}`, 'storage', [
      [
        'requested',
        row.requestedAt,
        {
          title: `Storage clearance requested (${amount})`,
          description: `Reason: ${row.reason}`,
          actorId: row.requestedBy,
        },
      ],
      [
        'approved',
        row.approvedAt,
        {
          title: 'Storage clearance approved',
          description: row.approvalNote,
          actorId: row.approvedBy,
        },
      ],
      [
        'returned',
        row.returnedAt,
        {
          title: 'Storage clearance returned for review',
          description: row.returnNote,
          actorId: row.returnedBy,
        },
      ],
      [
        'rejected',
        row.rejectedAt,
        {
          title: 'Storage clearance rejected',
          description: row.rejectionNote,
          actorId: row.rejectedBy,
        },
      ],
      [
        'executed',
        row.executedAt,
        {
          title: `Storage clearance executed ${money(row.executedAmountPsw)}`,
          actorId: row.executedBy,
        },
      ],
    ]);
  });
}

export function mapDispositions(rows: Rows<'listParcelDispositionEventsRepo'>) {
  return rows.flatMap((row) =>
    steps(`disposition:${row.id}`, 'storage', [
      [
        'performed',
        row.performedAt,
        {
          title: dispositionLabel(row.actionType) ?? 'Disposition recorded',
          description: joinParts([
            row.warehouseName && `Warehouse: ${row.warehouseName}`,
            row.recoveredAmountPsw > 0 && `Recovered ${money(row.recoveredAmountPsw)}`,
            row.notes,
          ]),
          actorId: row.performedBy,
        },
      ],
    ]),
  );
}
