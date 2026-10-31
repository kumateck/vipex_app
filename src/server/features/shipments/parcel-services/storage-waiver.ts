import { postParcelStorageWaiver } from '../parcel-storage-waiver-posting.service';
import { toPesewas } from '@/server/utils/gh-money';
import { db } from '@/db/config';
import { recordAuditLog } from '../../audit/logger';
import { listParcelDispositionActionsRepo } from '../parcels.repository';
import {
  resolveAndValidateStorageWaiverAmountPsw,
  validateStorageWaiverReason,
} from '../storage-accrual-guards';
import { getParcelStorageSettlementSvc } from './storage';
import { getParcelSvc } from './queries';

export async function listParcelDispositionActionsSvc(parcelId: string) {
  await getParcelSvc(parcelId);
  return listParcelDispositionActionsRepo(parcelId);
}

export async function waiveParcelStorageAccrualSvc(input: {
  parcelId: string;
  actorUserId: string;
  reason: string;
  waivedAmountCedis?: number | string | null;
}) {
  const parcel = await getParcelSvc(input.parcelId);
  const reason = validateStorageWaiverReason(input.reason);

  const before = await getParcelStorageSettlementSvc(input.parcelId);

  const requestedPswRaw =
    input.waivedAmountCedis != null
      ? Number(toPesewas(input.waivedAmountCedis))
      : before.outstandingPsw;
  const requestedPsw = resolveAndValidateStorageWaiverAmountPsw({
    outstandingPsw: before.outstandingPsw,
    requestedPsw: requestedPswRaw,
  });

  const posting = await db.transaction((tx) =>
    postParcelStorageWaiver(
      {
        parcelId: input.parcelId,
        actorUserId: input.actorUserId,
        reason,
        amountPsw: requestedPsw,
        parcel,
      },
      tx,
    ),
  );

  const after = await getParcelStorageSettlementSvc(input.parcelId);

  await recordAuditLog({
    companyId: parcel.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: input.parcelId,
    action: 'PARCEL_STORAGE_WAIVED',
    message: `Parcel storage accrual waived for ${parcel.trackingCode}`,
    metadata: {
      waivedAmountPsw: requestedPsw,
      reason,
      beforeOutstandingPsw: before.outstandingPsw,
      afterOutstandingPsw: after.outstandingPsw,
      accountingPosting: posting,
    },
  });

  return { id: input.parcelId };
}
