import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, parcels } from '@/db/schemas';
import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import type { AuthUser } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  MAX_PARCEL_HANDOVER_NOTE_LENGTH,
  type ParcelHandoverNote,
} from '@/shared/shipments/parcel-handover-note';
import { handoverNoteEditable, handoverNoteProjection } from './projection';

const columns = {
  id: parcels.id,
  companyId: parcels.companyId,
  sourceId: parcels.sourceId,
  destinationId: parcels.destinationId,
  note: parcels.handoverNote,
  editable: handoverNoteEditable,
  critical: handoverNoteProjection.handoverNoteCritical,
};

function noteScope(parcel: { sourceId: string; destinationId: string }, user: AuthUser) {
  const atParcelBranch = Boolean(
    user.branchId && (user.branchId === parcel.sourceId || user.branchId === parcel.destinationId),
  );
  if (!atParcelBranch && !user.permissions?.includes(PermissionKeys.CanReadParcels))
    throw NotFound('Parcel not found');
  return (
    atParcelBranch &&
    Boolean(user.permissions?.includes(PermissionKeys.CanUpdateParcelHandoverNote))
  );
}

function parcelFilter(id: string, user: AuthUser) {
  if (!user.companyId) throw NotFound('Parcel not found');
  return and(
    eq(parcels.id, id),
    eq(parcels.companyId, user.companyId),
    eq(parcels.isDeleted, false),
  );
}

export async function getParcelHandoverNote(
  id: string,
  user: AuthUser,
): Promise<ParcelHandoverNote> {
  const [parcel] = await db.select(columns).from(parcels).where(parcelFilter(id, user)).limit(1);
  if (!parcel) throw NotFound('Parcel not found');
  const canWrite = noteScope(parcel, user);
  return {
    note: parcel.note,
    critical: parcel.critical,
    canEdit: canWrite && parcel.editable,
  };
}

export async function saveParcelHandoverNote(input: {
  id: string;
  user: AuthUser;
  note: string;
  expectedNote: string | null;
}): Promise<ParcelHandoverNote> {
  const note = input.note.trim();
  if (!note || note.length > MAX_PARCEL_HANDOVER_NOTE_LENGTH)
    throw BadRequest('Enter a note of 1 to 1000 characters');
  return db.transaction(async (tx) => {
    const [parcel] = await tx
      .select(columns)
      .from(parcels)
      .where(parcelFilter(input.id, input.user))
      .for('update');
    if (!parcel) throw NotFound('Parcel not found');
    if (!noteScope(parcel, input.user))
      throw Forbidden('Your branch or role cannot edit this note');
    if (!parcel.editable)
      throw Conflict('Handover notes can only be edited before delivery on an active parcel');
    if (parcel.note !== input.expectedNote)
      throw Conflict('The note changed. Reopen it to see the latest version.');
    if (parcel.note !== note) {
      await tx
        .update(parcels)
        .set({ handoverNote: note, updatedAt: new Date() })
        .where(eq(parcels.id, parcel.id));
      await tx.insert(auditLogs).values({
        companyId: parcel.companyId,
        actorUserId: input.user.sub,
        entityType: 'parcel',
        entityId: parcel.id,
        action: 'PARCEL_HANDOVER_NOTE_SAVED',
        message: parcel.note ? 'Handover note updated' : 'Handover note added',
      });
    }
    return { note, critical: true, canEdit: true };
  });
}
