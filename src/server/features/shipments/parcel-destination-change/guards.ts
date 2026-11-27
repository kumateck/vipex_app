import {
  getDestinationChangePhase,
  getDestinationChangeRestriction,
} from '@/shared/shipments/parcel-destination-change';
import { getOpenReconciliationCaseBlockingDeliveryRepo } from '../parcel-reconciliation-cases.repository';
import { getOpenParcelStorageClearanceRepo } from '../parcel-storage-clearance.repository';
import { getParcelStorageSettlementSvc } from '../parcel-services/storage';
import type { Executor, ParcelDestinationState } from './repository';

/**
 * Status rules plus the database-backed blockers: open reconciliation or storage clearance
 * work, and storage already paid/waived at the current destination when forwarding (restarting
 * storage on arrival would orphan those postings).
 */
export async function findDestinationChangeBlocker(
  parcel: ParcelDestinationState,
  tx: Executor,
): Promise<string | null> {
  const restriction = getDestinationChangeRestriction(parcel);
  if (restriction) return restriction;
  const [reconciliation, clearance] = await Promise.all([
    getOpenReconciliationCaseBlockingDeliveryRepo(parcel.id, tx),
    getOpenParcelStorageClearanceRepo(parcel.id, tx),
  ]);
  if (reconciliation)
    return 'Resolve the open reconciliation case before changing the destination.';
  if (clearance)
    return 'Finish the open storage clearance request before changing the destination.';
  if (getDestinationChangePhase(parcel.status) === 'forward' && parcel.receivedAt) {
    const storage = await getParcelStorageSettlementSvc(parcel.id, tx);
    if (storage.paidPsw > 0 || storage.waivedPsw > 0)
      return 'Storage has already been paid or waived at the current destination. Reconcile it before forwarding the parcel.';
  }
  return null;
}
