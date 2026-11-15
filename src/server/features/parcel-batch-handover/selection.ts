import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, customers, parcels, ParcelStatus, users, UserStatus } from '@/db/schemas';
import {
  MAX_BATCH_PARCELS,
  normalizeBatchTelephone,
  type BatchHandoverWorkflow,
  type BatchSelection,
} from '@/shared/shipments/parcel-batch-handover';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { sha256HexAsync } from '@/server/utils/otp';
import type { DbExecutor } from '../shipments/parcel-repositories/parcel-repository.types';

export type BatchActor = {
  companyId: string;
  branchId: string;
  actorId: string;
  locationId?: string | null;
  workflow: BatchHandoverWorkflow;
};

export function batchTelephone(value: string) {
  const telephone = normalizeBatchTelephone(value);
  if (!/^0[0-9]{9}$/.test(telephone))
    throw BadRequest('Enter a complete receiver telephone number');
  return telephone;
}

export async function batchSelectionKey(actor: BatchActor, input: BatchSelection) {
  const telephone = batchTelephone(input.telephone);
  const ids = new Set(input.items.map(({ id }) => id));
  if (ids.size !== input.items.length || ids.size < 2 || ids.size > MAX_BATCH_PARCELS) {
    throw BadRequest(`Select between 2 and ${MAX_BATCH_PARCELS} different parcels`);
  }
  const items = input.items
    .map(
      ({ id, receiverId, principalPsw, storagePsw }) =>
        [id, receiverId, principalPsw, storagePsw] as const,
    )
    .sort(([a], [b]) => a.localeCompare(b));
  const selection = [actor.companyId, actor.branchId, actor.locationId ?? null, telephone, items];
  return `${actor.workflow}:${await sha256HexAsync(JSON.stringify(selection))}`;
}

export function availableParcelScope(actor: BatchActor) {
  return and(
    eq(parcels.companyId, actor.companyId),
    eq(parcels.destinationId, actor.branchId),
    eq(parcels.status, ParcelStatus.AWAITING_PICKUP),
    isNull(parcels.confirmedAt),
    isNull(parcels.pendingReceiverHandover),
    eq(parcels.isDeleted, false),
  );
}

export async function getBatchBranch(actor: BatchActor, tx?: DbExecutor) {
  const query = (tx ?? db)
    .select({ usePickupQueue: branches.usePickupQueue })
    .from(branches)
    .where(
      and(
        eq(branches.id, actor.branchId),
        eq(branches.companyId, actor.companyId),
        eq(branches.isDeleted, false),
      ),
    );
  const [branch] = await (tx ? query.for('share') : query);
  if (!branch) throw NotFound('Destination branch not found');
  return branch;
}

export function batchStaffScope(actor: BatchActor) {
  return and(
    eq(users.companyId, actor.companyId),
    eq(users.branchId, actor.branchId),
    eq(users.status, UserStatus.ACTIVE),
    actor.locationId ? eq(users.locationId, actor.locationId) : undefined,
  );
}

export async function getBatchMembers(
  actor: BatchActor,
  selection: BatchSelection,
  tx?: DbExecutor,
) {
  const executor = tx ?? db;
  const expected = new Map(selection.items.map((item) => [item.id, item]));
  const parcelQuery = executor
    .select()
    .from(parcels)
    .where(and(availableParcelScope(actor), inArray(parcels.id, [...expected.keys()])))
    .orderBy(asc(parcels.id));
  const rows = await (tx ? parcelQuery.for('update') : parcelQuery);
  if (rows.length !== expected.size)
    throw Conflict('A selected parcel is no longer awaiting handover. Search again.');

  const customerQuery = executor
    .select({
      id: customers.id,
      name: customers.fullname,
      phone: customers.telephone,
      phone2: customers.telephone2,
    })
    .from(customers)
    .where(
      and(
        eq(customers.companyId, actor.companyId),
        eq(customers.isDeleted, false),
        inArray(customers.id, [...new Set(rows.map((row) => row.receiverId))]),
      ),
    )
    .orderBy(asc(customers.id));
  const receivers = await (tx ? customerQuery.for('share') : customerQuery);
  const byReceiver = new Map(receivers.map((receiver) => [receiver.id, receiver]));
  const telephone = batchTelephone(selection.telephone);

  return rows.map((parcel) => {
    const receiver = byReceiver.get(parcel.receiverId);
    const quote = expected.get(parcel.id)!;
    const matchesPhone = [receiver?.phone, receiver?.phone2].some(
      (value) => value && normalizeBatchTelephone(value) === telephone,
    );
    if (!receiver || !matchesPhone || parcel.receiverId !== quote.receiverId) {
      throw Conflict('A selected parcel no longer matches the receiver telephone. Search again.');
    }
    return { parcel, receiver, quote };
  });
}
