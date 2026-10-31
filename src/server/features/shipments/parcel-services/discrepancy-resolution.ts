import { ParcelStatus } from '@/db/schemas';
import { db } from '@/db/config';
import { BadRequest, NotFound } from '../../../utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import { resolveParcelDiscrepancyRepo } from '../parcel-discrepancies.repository';
import { getParcelRepo, updateParcelRepo } from '../parcels.repository';
import { isSchemaCompatibilityError } from './helpers';

export async function resolveParcelDiscrepancySvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  resolutionNote?: string | null;
}) {
  let resolved: {
    id: string;
    parcelId: string | null;
    companyId: string;
    trackingCode: string | null;
    bookingCode: string | null;
  } | null;

  try {
    resolved = await resolveParcelDiscrepancyRepo(input.id, input.companyId, {
      resolvedBy: input.actorUserId,
      resolvedAt: new Date(),
      resolutionNote: input.resolutionNote?.trim() || null,
    });
  } catch (error) {
    if (!isSchemaCompatibilityError(error)) throw error;

    const parcel = await getParcelRepo(input.id);
    if (!parcel || parcel.companyId !== input.companyId) {
      throw NotFound('Discrepancy parcel not found');
    }
    if (parcel.status !== ParcelStatus.DISCREPANCY) {
      throw BadRequest('Parcel is not in discrepancy status');
    }

    await updateParcelRepo(parcel.id, { status: ParcelStatus.IN_TRANSIT }, db);

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel_discrepancy',
      entityId: parcel.id,
      action: 'PARCEL_DISCREPANCY_RESOLVED',
      message: 'Parcel discrepancy resolved (compat mode)',
      metadata: {
        parcelId: parcel.id,
        trackingCode: parcel.trackingCode,
        bookingCode: parcel.bookingCode,
        resolutionNote: input.resolutionNote?.trim() || null,
        compatibilityMode: true,
      },
    });

    return { id: parcel.id, parcelId: parcel.id };
  }

  if (!resolved) throw NotFound('Open discrepancy not found');

  if (resolved.parcelId) {
    await updateParcelRepo(resolved.parcelId, { status: ParcelStatus.IN_TRANSIT }, db);
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel_discrepancy',
    entityId: resolved.id,
    action: 'PARCEL_DISCREPANCY_RESOLVED',
    message: 'Parcel discrepancy resolved',
    metadata: {
      parcelId: resolved.parcelId,
      trackingCode: resolved.trackingCode,
      bookingCode: resolved.bookingCode,
      resolutionNote: input.resolutionNote?.trim() || null,
    },
  });

  return { id: resolved.id, parcelId: resolved.parcelId };
}
