import { randomUUID } from 'node:crypto';
import { Conflict, NotFound } from '@/server/utils/http-error';
import { MomoTransactionStatus } from '@/db/schemas';
import {
  createMomoTransactionRepo,
  getMomoTransactionByExternalRefRepo,
  getMomoTransactionByIdRepo,
  updateMomoTransactionStatusRepo,
} from './repository';
import {
  getRequestToPayStatusClient,
  requestToPayClient,
  resolveMomoConfig,
  type MomoRequestToPayStatus,
} from './client';

type MomoFlow = 'sender' | 'receiver';

export async function initiateMomoRequestToPaySvc(input: {
  companyId: string;
  branchId: string;
  parcelId: string;
  flow: MomoFlow;
  momoNumber: string;
  amountCedis: number;
  requestedBy: string;
}) {
  const config = await resolveMomoConfig(input.companyId);
  const externalReferenceId = randomUUID();

  const created = await createMomoTransactionRepo({
    companyId: input.companyId,
    branchId: input.branchId,
    parcelId: input.parcelId,
    flow: input.flow,
    payerMomoNumber: input.momoNumber,
    amountPsw: Math.round(input.amountCedis * 100),
    externalReferenceId,
    status: MomoTransactionStatus.PENDING,
    requestedBy: input.requestedBy,
  });
  if (!created) throw Conflict('Unable to create MoMo transaction right now. Please retry.');

  const result = await requestToPayClient(config, {
    externalReferenceId,
    amountCedis: input.amountCedis,
    payerMomoNumber: input.momoNumber,
    payerMessage: `Vipex parcel payment`,
    payeeNote: `Parcel ${input.parcelId}`,
  });

  if (!result.ok) {
    await updateMomoTransactionStatusRepo(created.id, {
      status: MomoTransactionStatus.FAILED,
      statusReason: result.errorMessage ?? 'Request to pay failed',
    });
    throw Conflict(result.errorMessage ?? 'Failed to initiate MoMo request to pay');
  }

  return { id: created.id, status: MomoTransactionStatus.PENDING };
}

function mapMomoStatus(status: MomoRequestToPayStatus): number {
  if (status === 'SUCCESSFUL') return MomoTransactionStatus.SUCCESSFUL;
  if (status === 'FAILED') return MomoTransactionStatus.FAILED;
  return MomoTransactionStatus.PENDING;
}

async function applyMomoStatusUpdate(
  transactionId: string,
  update: { status: MomoRequestToPayStatus; financialTransactionId?: string; reason?: string },
  receivedVia: 'callback' | 'poll',
) {
  const patch: Partial<Parameters<typeof updateMomoTransactionStatusRepo>[1]> = {
    status: mapMomoStatus(update.status),
    providerTransactionId: update.financialTransactionId ?? null,
    statusReason: update.reason ?? null,
  };
  if (receivedVia === 'callback') {
    patch.callbackReceivedAt = new Date();
  } else {
    patch.lastPolledAt = new Date();
  }
  return updateMomoTransactionStatusRepo(transactionId, patch);
}

export async function getMomoTransactionStatusSvc(input: { id: string; companyId: string }) {
  const existing = await getMomoTransactionByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('MoMo transaction not found');

  if (existing.status !== MomoTransactionStatus.PENDING) {
    return { id: existing.id, status: existing.status, statusReason: existing.statusReason };
  }

  const config = await resolveMomoConfig(input.companyId);
  const remoteStatus = await getRequestToPayStatusClient(config, existing.externalReferenceId);
  const updated = await applyMomoStatusUpdate(existing.id, remoteStatus, 'poll');

  return {
    id: existing.id,
    status: updated?.status ?? existing.status,
    statusReason: updated?.statusReason ?? null,
  };
}

export async function handleMomoCallbackSvc(payload: {
  externalId?: string;
  status?: string;
  financialTransactionId?: string;
  reason?: string;
}) {
  const externalReferenceId = payload.externalId;
  if (!externalReferenceId) return { ok: false };

  const existing = await getMomoTransactionByExternalRefRepo(externalReferenceId);
  if (!existing) return { ok: false };

  const status: MomoRequestToPayStatus =
    payload.status === 'SUCCESSFUL' || payload.status === 'FAILED' ? payload.status : 'PENDING';

  await applyMomoStatusUpdate(
    existing.id,
    {
      status,
      financialTransactionId: payload.financialTransactionId,
      reason: payload.reason,
    },
    'callback',
  );

  return { ok: true };
}

export async function linkPaymentToMomoTransactionSvc(
  momoTransactionId: string,
  paymentId: string,
) {
  await updateMomoTransactionStatusRepo(momoTransactionId, { paymentId });
}
