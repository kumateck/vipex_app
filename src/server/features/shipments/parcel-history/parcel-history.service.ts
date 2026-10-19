import { NotFound } from '@/server/utils/http-error';
import { listBranchNamesByIdsRepo, listUserNamesByIdsRepo } from '../parcel-actors.repository';
import { getParcelSvc } from '../parcels.service';
import { isArrivalAudit, mapAuditEntry } from './parcel-history-audit';
import * as core from './parcel-history-core.repository';
import * as extras from './parcel-history-extras.repository';
import * as extraMap from './parcel-history-extras';
import {
  mapConsignmentMoves,
  mapDeliveries,
  mapParcelRecord,
  mapPayments,
} from './parcel-history-records';
import type { ParcelHistoryDraft, ParcelHistoryEvent } from './parcel-history.types';

/** Missing tables/columns (older schema) yield no entries instead of failing the history. */
async function tolerant<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch (error) {
    const code =
      (error as { cause?: { code?: string }; code?: string })?.cause?.code ??
      (error as { code?: string })?.code;
    if (code === '42P01' || code === '42703') return [];
    throw error;
  }
}

export function toParcelHistoryEvents(
  drafts: ParcelHistoryDraft[],
  userNames: Record<string, string>,
  branchNames: Record<string, string>,
): ParcelHistoryEvent[] {
  const userName = (id: string | null | undefined) =>
    id ? (userNames[id] ?? 'Unknown user') : null;
  return drafts
    .map((draft) => {
      const subject = draft.subject?.userId
        ? `${draft.subject.label}: ${userName(draft.subject.userId)}`
        : null;
      return {
        id: draft.id,
        occurredAt: draft.occurredAt.toISOString(),
        category: draft.category,
        title: draft.title,
        description: [subject, draft.description].filter(Boolean).join(' • ') || null,
        actorName: userName(draft.actorId),
        branchName: draft.branchId ? (branchNames[draft.branchId] ?? null) : null,
      };
    })
    .toSorted((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id));
}

export async function getParcelHistorySvc(
  parcelId: string,
  scope: { companyId?: string | null } = {},
): Promise<{ events: ParcelHistoryEvent[] }> {
  const parcel = await getParcelSvc(parcelId);
  if (scope.companyId && parcel.companyId !== scope.companyId) throw NotFound('Parcel not found');

  const [
    audit,
    moves,
    paymentRows,
    deliveryRows,
    queues,
    transfers,
    otps,
    stickers,
    discrepancies,
    cases,
    waivers,
    clearances,
    dispositions,
  ] = await Promise.all([
    tolerant(() => core.listParcelAuditEntriesRepo(parcelId)),
    tolerant(() => core.listParcelConsignmentMovesRepo(parcelId)),
    tolerant(() => core.listParcelPaymentEventsRepo(parcelId)),
    tolerant(() => core.listParcelDeliveryEventsRepo(parcelId)),
    tolerant(() => extras.listParcelPickupQueueEventsRepo(parcelId)),
    tolerant(() => extras.listParcelTransferEventsRepo(parcelId)),
    tolerant(() => extras.listParcelOtpEventsRepo(parcelId)),
    tolerant(() => extras.listParcelStickerPrintEventsRepo(parcelId)),
    tolerant(() => extras.listParcelDiscrepancyEventsRepo(parcelId)),
    tolerant(() => extras.listParcelReconciliationEventsRepo(parcelId)),
    tolerant(() => extras.listParcelStorageWaiverEventsRepo(parcelId)),
    tolerant(() => extras.listParcelClearanceEventsRepo(parcelId)),
    tolerant(() => extras.listParcelDispositionEventsRepo(parcelId)),
  ]);

  const drafts: ParcelHistoryDraft[] = [
    ...mapParcelRecord(parcel, {
      hasArrivalEvent: audit.some(isArrivalAudit),
      hasDeletionEvent: audit.some((entry) => entry.action === 'PARCEL_SOFT_DELETED'),
    }),
    ...audit.flatMap(mapAuditEntry),
    ...mapConsignmentMoves(moves),
    ...mapPayments(paymentRows),
    ...mapDeliveries(deliveryRows),
    ...extraMap.mapPickupQueues(queues),
    ...extraMap.mapTransfers(transfers),
    ...extraMap.mapOtps(otps),
    ...extraMap.mapStickerPrints(stickers),
    ...extraMap.mapDiscrepancies(discrepancies),
    ...extraMap.mapReconciliationCases(cases),
    ...extraMap.mapStorageWaivers(waivers),
    ...extraMap.mapClearances(clearances),
    ...extraMap.mapDispositions(dispositions),
  ];

  const userIds = new Set<string>();
  const branchIds = new Set<string>();
  for (const draft of drafts) {
    if (draft.actorId) userIds.add(draft.actorId);
    if (draft.subject?.userId) userIds.add(draft.subject.userId);
    if (draft.branchId) branchIds.add(draft.branchId);
  }
  const [userNames, branchNames] = await Promise.all([
    listUserNamesByIdsRepo([...userIds]),
    listBranchNamesByIdsRepo([...branchIds]),
  ]);
  return { events: toParcelHistoryEvents(drafts, userNames, branchNames) };
}
