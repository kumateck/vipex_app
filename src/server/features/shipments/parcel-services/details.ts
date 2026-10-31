import { NotFound } from '../../../utils/http-error';
import { listPaymentsForParcelRepo } from '../../payments/repository';
import { getDeliveryByParcelRepo } from '../../deliveries/repository';
import { listUserNamesByIdsRepo } from '../parcel-actors.repository';
import { collectParcelDetailsUserIds } from '../parcel-details-actors';
import { listConsignmentsForParcelRepo } from '../consignments.repository';
import { getPickupQueueByParcelRepo } from '../../pickup-queues/repository';
import { getParcelInternalHolderByParcelRepo } from '../../parcel-internal-transfers/repository';
import {
  listParcelDispositionActionsRepo,
  listParcelStorageWaiversRepo,
} from '../parcels.repository';
import { isSchemaCompatibilityError } from './helpers';
import { getParcelStorageSettlementSvc } from './storage';
import { listParcelsSvc, getParcelSvc } from './queries';

export async function getParcelFullDetailsSvc(
  id: string,
  scope: { companyId?: string | null } = {},
) {
  const parcel = await getParcelSvc(id);
  // Same 404 as a missing parcel so other companies' parcel ids are not disclosed.
  if (scope.companyId && parcel.companyId !== scope.companyId) throw NotFound('Parcel not found');
  const [
    summary,
    payments,
    delivery,
    consignments,
    pickupQueue,
    internalHolder,
    dispositionActions,
    storageWaivers,
    storageSettlement,
  ] = await Promise.all([
    listParcelsSvc({ parcelId: id, includeDeleted: true, limit: 1, offset: 0 }).then(
      (result) => result.data[0] ?? null,
    ),
    (async () => {
      try {
        return await listPaymentsForParcelRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return [];
        throw error;
      }
    })(),
    (async () => {
      try {
        return await getDeliveryByParcelRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return null;
        throw error;
      }
    })(),
    (async () => {
      try {
        return await listConsignmentsForParcelRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return [];
        throw error;
      }
    })(),
    (async () => {
      try {
        return await getPickupQueueByParcelRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return null;
        throw error;
      }
    })(),
    (async () => {
      try {
        return await getParcelInternalHolderByParcelRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return null;
        throw error;
      }
    })(),
    (async () => {
      try {
        return await listParcelDispositionActionsRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return [];
        throw error;
      }
    })(),
    (async () => {
      try {
        return await listParcelStorageWaiversRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return [];
        throw error;
      }
    })(),
    (async () => {
      try {
        return await getParcelStorageSettlementSvc(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) {
          return { parcelId: id, accruedPsw: 0, paidPsw: 0, waivedPsw: 0, outstandingPsw: 0 };
        }
        throw error;
      }
    })(),
  ]);

  const userNames = await listUserNamesByIdsRepo(
    collectParcelDetailsUserIds({ parcel, payments, delivery, pickupQueue }),
  );

  return {
    parcel,
    summary,
    payments,
    delivery: delivery
      ? {
          ...delivery,
          riderName: delivery.riderUserId ? (userNames[delivery.riderUserId] ?? null) : null,
        }
      : null,
    userNames,
    consignments,
    pickupQueue,
    internalHolder,
    dispositionActions,
    storageWaivers,
    storageSettlement,
  };
}
