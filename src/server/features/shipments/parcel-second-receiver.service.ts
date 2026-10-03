import { BadRequest, Conflict } from '../../utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { findOrCreateCustomerSvc } from '../customers/service';
import {
  getSecondReceiverCandidateRepo,
  replaceSecondReceiverRepo,
} from './parcel-second-receiver.repository';
import {
  assertNotMainReceiver,
  assertSecondReceiverCandidate,
  normalizeSecondReceiverInput,
} from './parcel-second-receiver.rules';

// No SMS or email is sent from here: only the call outcome flow notifies customers.

type ActorContext = {
  parcelId: string;
  companyId: string;
  branchId: string;
  actorUserId: string;
};

async function loadCandidate(input: ActorContext) {
  if (!input.companyId || !input.branchId) throw BadRequest('Company and branch are required');
  const parcel = await getSecondReceiverCandidateRepo(input.parcelId);
  assertSecondReceiverCandidate(parcel, input);
  return parcel;
}

async function applyChange(
  input: ActorContext,
  parcel: Awaited<ReturnType<typeof loadCandidate>>,
  secondReceiverId: string | null,
) {
  const saved = await replaceSecondReceiverRepo({
    parcelId: input.parcelId,
    companyId: input.companyId,
    branchId: input.branchId,
    receiverId: parcel.receiverId,
    secondReceiverId,
  });
  if (!saved) throw Conflict('Parcel changed while saving; reload and try again');
}

export async function setParcelSecondReceiverSvc(
  input: ActorContext & { fullname: string; telephone: string },
) {
  const { fullname, telephone } = normalizeSecondReceiverInput(input);
  const parcel = await loadCandidate(input);

  // An existing customer with this telephone is reused as-is (same as the call outcome flow).
  const customer = await findOrCreateCustomerSvc({
    companyId: input.companyId,
    fullname,
    telephone,
    createdBy: input.actorUserId,
  });
  assertNotMainReceiver(parcel, customer.id);
  const changed = customer.id !== parcel.secondReceiverId;
  if (!changed) return { id: parcel.id, secondReceiverId: customer.id, changed };

  await applyChange(input, parcel, customer.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: input.parcelId,
    action: 'PARCEL_SECOND_RECEIVER_SET',
    message: `Second receiver set for ${parcel.bookingCode}`,
    metadata: {
      previousSecondReceiverId: parcel.secondReceiverId,
      previousSecondReceiverName: parcel.secondReceiverNameSnapshot,
      secondReceiverId: customer.id,
      telephone,
    },
  });
  return { id: parcel.id, secondReceiverId: customer.id, changed };
}

export async function removeParcelSecondReceiverSvc(input: ActorContext) {
  const parcel = await loadCandidate(input);
  if (!parcel.secondReceiverId) return { id: parcel.id, secondReceiverId: null, changed: false };

  await applyChange(input, parcel, null);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: input.parcelId,
    action: 'PARCEL_SECOND_RECEIVER_REMOVED',
    message: `Second receiver removed from ${parcel.bookingCode}`,
    metadata: {
      previousSecondReceiverId: parcel.secondReceiverId,
      previousSecondReceiverName: parcel.secondReceiverNameSnapshot,
    },
  });
  return { id: parcel.id, secondReceiverId: null, changed: true };
}
