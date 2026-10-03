import { canEditSecondReceiver } from '@/shared/shipments/second-receiver';
import { BadRequest, Conflict, NotFound } from '../../utils/http-error';

type Candidate = {
  companyId: string;
  destinationId: string;
  receiverId: string;
  isDeleted: boolean;
  status: number;
};

export function normalizeSecondReceiverInput(input: { fullname: string; telephone: string }) {
  const fullname = input.fullname.trim();
  const telephone = input.telephone.replace(/\D/g, '');
  if (!fullname) throw BadRequest('Second receiver name is required');
  if (!/^\d{10}$/.test(telephone)) throw BadRequest('Second receiver telephone must be 10 digits');
  return { fullname, telephone };
}

export function assertSecondReceiverCandidate<T extends Candidate>(
  parcel: T | null | undefined,
  context: { companyId: string; branchId: string },
): asserts parcel is T {
  if (
    !parcel ||
    parcel.isDeleted ||
    parcel.companyId !== context.companyId ||
    parcel.destinationId !== context.branchId
  ) {
    throw NotFound('Parcel not found at your branch');
  }
  if (!canEditSecondReceiver(parcel.status)) {
    throw Conflict('This parcel can no longer change its second receiver');
  }
}

export function assertNotMainReceiver(parcel: Candidate, secondReceiverId: string) {
  if (secondReceiverId === parcel.receiverId) {
    throw Conflict('The main receiver cannot also be the second receiver');
  }
}
