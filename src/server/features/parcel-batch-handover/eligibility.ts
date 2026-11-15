import type { parcels } from '@/db/schemas';
import { db } from '@/db/config';
import { Conflict } from '@/server/utils/http-error';
import { getPickupQueueDate } from '../pickup-queues/queue-date';
import {
  getPickupQueueByParcelAndDateRepo,
  getPickupQueueByParcelRepo,
} from '../pickup-queues/repository';
import { getParcelPaymentSettlement } from '../shipments/parcel-payment-settlement';
import { getParcelStorageSettlementSvc } from '../shipments/parcel-services/storage';
import type { DbExecutor } from '../shipments/parcel-repositories/parcel-repository.types';
import type { BatchActor, getBatchMembers } from './selection';

type Parcel = Pick<typeof parcels.$inferSelect, 'id' | 'shelfPickerStaffId'>;
type Member = Awaited<ReturnType<typeof getBatchMembers>>[number];

export async function getBatchEligibility(
  actor: BatchActor,
  parcel: Parcel,
  usePickupQueue: boolean,
  executor: DbExecutor = db,
) {
  const [payment, storage, queue] = await Promise.all([
    getParcelPaymentSettlement(parcel.id, executor),
    getParcelStorageSettlementSvc(parcel.id, executor),
    usePickupQueue
      ? getPickupQueueByParcelAndDateRepo(
          { parcelId: parcel.id, queueDate: getPickupQueueDate() },
          executor,
        )
      : actor.workflow === 'office-pickup'
        ? getPickupQueueByParcelRepo(parcel.id, executor)
        : null,
  ]);
  const principalPsw = payment.requiredPrincipalPsw - payment.paidPrincipalPsw;
  const storagePsw = storage.outstandingPsw;
  const associate = parcel.shelfPickerStaffId ?? queue?.pickerStaffId ?? null;
  const matchesWorkflow =
    actor.workflow === 'receiver-cashier'
      ? principalPsw > 0 || storagePsw > 0
      : principalPsw === 0 && storagePsw === 0;
  const hasInvalidBalance = principalPsw < 0 || payment.outstandingPsw !== principalPsw;
  const blockedReason = hasInvalidBalance
    ? 'The parcel balance needs review.'
    : usePickupQueue && queue?.branchId !== actor.branchId
      ? 'Issue a pickup ticket for today first.'
      : !associate && !actor.locationId
        ? 'An assigned location is required to select a shelf picker.'
        : null;
  return {
    principalPsw,
    storagePsw,
    queueNumber: usePickupQueue ? (queue?.queueNumber ?? null) : null,
    associate,
    matchesWorkflow,
    blockedReason,
  };
}

export async function checkBatchQuote(
  actor: BatchActor,
  { parcel, quote }: Member,
  usePickupQueue: boolean,
  executor?: DbExecutor,
) {
  const current = await getBatchEligibility(actor, parcel, usePickupQueue, executor);
  if (
    !current.matchesWorkflow ||
    current.principalPsw !== quote.principalPsw ||
    current.storagePsw !== quote.storagePsw
  ) {
    throw Conflict(`The balance for ${parcel.trackingCode} changed. Search again.`);
  }
  if (current.blockedReason) throw Conflict(`${parcel.trackingCode} · ${current.blockedReason}`);
  return current;
}
