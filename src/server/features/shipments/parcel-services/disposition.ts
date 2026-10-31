import { toPesewas } from '@/server/utils/gh-money';
import { ParcelHolderType, ParcelDispositionActionType, ParcelStatus } from '@/db/schemas';
import { db } from '@/db/config';
import { BadRequest, Conflict, NotFound } from '../../../utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import {
  getWarehouseForTransferRepo,
  upsertParcelInternalHolderRepo,
} from '../../parcel-internal-transfers/repository';
import { createParcelDispositionActionRepo, updateParcelRepo } from '../parcels.repository';
import { getParcelSvc } from './queries';

export async function recordParcelDispositionActionSvc(input: {
  parcelId: string;
  actorUserId: string;
  actionType: number;
  notes?: string | null;
  warehouseId?: string | null;
  recoveredAmountCedis?: number | string | null;
}) {
  const parcel = await getParcelSvc(input.parcelId);
  const normalizedNotes = input.notes?.trim() || null;
  const recoveredAmountPsw =
    input.recoveredAmountCedis != null ? Number(toPesewas(input.recoveredAmountCedis)) : 0;

  const actionType = Number(input.actionType);
  if (!Object.values(ParcelDispositionActionType).includes(actionType)) {
    throw BadRequest('Unsupported parcel disposition action');
  }

  if (
    (actionType === ParcelDispositionActionType.SOLD ||
      actionType === ParcelDispositionActionType.DESTROYED ||
      actionType === ParcelDispositionActionType.DONATED) &&
    !normalizedNotes
  ) {
    throw BadRequest('Notes are required for final disposition actions');
  }

  let nextStatus: number | null = null;
  if (actionType === ParcelDispositionActionType.TRANSFERRED_TO_WAREHOUSE) {
    nextStatus = ParcelStatus.AGED_IN_WAREHOUSE;
    if (!input.warehouseId) throw BadRequest('Warehouse is required for warehouse transfer');
    const warehouse = await getWarehouseForTransferRepo(input.warehouseId);
    if (!warehouse || warehouse.isDeleted) throw NotFound('Selected warehouse not found');
    if (!warehouse.active) throw Conflict('Selected warehouse is inactive');
    if (warehouse.companyId !== parcel.companyId || warehouse.branchId !== parcel.destinationId) {
      throw Conflict('Selected warehouse must belong to parcel destination branch');
    }
  } else if (actionType === ParcelDispositionActionType.SOLD) {
    nextStatus = ParcelStatus.DISPOSED_BY_SALE;
  } else if (actionType === ParcelDispositionActionType.DESTROYED) {
    nextStatus = ParcelStatus.DISPOSED_BY_DESTRUCTION;
  } else if (actionType === ParcelDispositionActionType.DONATED) {
    nextStatus = ParcelStatus.DISPOSED_BY_DONATION;
  }

  const performedAt = new Date();

  await db.transaction(async (tx) => {
    await createParcelDispositionActionRepo(
      {
        companyId: parcel.companyId,
        parcelId: input.parcelId,
        actionType,
        warehouseId: input.warehouseId ?? null,
        notes: normalizedNotes,
        recoveredAmountPsw,
        performedBy: input.actorUserId,
        performedAt,
      },
      tx,
    );

    if (nextStatus != null && parcel.status !== nextStatus) {
      await updateParcelRepo(input.parcelId, { status: nextStatus }, tx);
    }

    if (actionType === ParcelDispositionActionType.TRANSFERRED_TO_WAREHOUSE && input.warehouseId) {
      await upsertParcelInternalHolderRepo(
        {
          parcelId: input.parcelId,
          companyId: parcel.companyId,
          branchId: parcel.destinationId,
          holderType: ParcelHolderType.WAREHOUSE,
          locationId: null,
          warehouseId: input.warehouseId,
          updatedBy: input.actorUserId,
        },
        tx,
      );
    }
  });

  await recordAuditLog({
    companyId: parcel.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: input.parcelId,
    action: 'PARCEL_DISPOSITION_ACTION_RECORDED',
    message: `Parcel disposition action recorded for ${parcel.trackingCode}`,
    metadata: {
      actionType,
      warehouseId: input.warehouseId ?? null,
      notes: normalizedNotes,
      recoveredAmountPsw,
      nextStatus,
    },
  });

  return { id: input.parcelId };
}
