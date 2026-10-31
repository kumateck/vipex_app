import { ParcelStatus } from '@/db/schemas';
import { db } from '@/db/config';
import { recordAuditLog } from '../../audit/logger';
import {
  createParcelDiscrepancyRepo,
  getOpenDiscrepancyByParcelRepo,
} from '../parcel-discrepancies.repository';
import { getParcelRepo, updateParcelRepo } from '../parcels.repository';
import { isSchemaCompatibilityError } from './helpers';

export async function logParcelDiscrepancySvc(input: {
  companyId: string;
  actorUserId?: string | null;
  parcelId?: string | null;
  trackingCode?: string | null;
  bookingCode?: string | null;
  discrepancyType: 'record_not_physical' | 'physical_missing_in_system';
  notes?: string | null;
  branchId?: string | null;
}) {
  const parcel = input.parcelId ? await getParcelRepo(input.parcelId) : null;

  if (input.discrepancyType === 'record_not_physical' && input.parcelId && parcel) {
    try {
      const open = await getOpenDiscrepancyByParcelRepo(input.parcelId);
      if (!open) {
        await createParcelDiscrepancyRepo({
          companyId: input.companyId,
          parcelId: input.parcelId,
          branchId: input.branchId ?? parcel.destinationId ?? null,
          trackingCode: input.trackingCode ?? parcel.trackingCode,
          bookingCode: input.bookingCode ?? parcel.bookingCode,
          discrepancyType: input.discrepancyType,
          notes: input.notes?.trim() || null,
          status: 0,
          createdBy: input.actorUserId ?? null,
        });
      }
    } catch (error) {
      if (!isSchemaCompatibilityError(error)) throw error;
    }

    if (parcel.status !== ParcelStatus.DISCREPANCY) {
      await updateParcelRepo(
        input.parcelId,
        {
          status: ParcelStatus.DISCREPANCY,
        },
        db,
      );
    }
  }

  if (input.discrepancyType === 'physical_missing_in_system') {
    try {
      await createParcelDiscrepancyRepo({
        companyId: input.companyId,
        parcelId: input.parcelId ?? null,
        branchId: input.branchId ?? null,
        trackingCode: input.trackingCode ?? null,
        bookingCode: input.bookingCode ?? null,
        discrepancyType: input.discrepancyType,
        notes: input.notes?.trim() || null,
        status: 0,
        createdBy: input.actorUserId ?? null,
      });
    } catch (error) {
      if (!isSchemaCompatibilityError(error)) throw error;
    }
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'parcel_discrepancy',
    entityId: input.parcelId ?? null,
    action: 'PARCEL_DISCREPANCY_LOGGED',
    message:
      input.discrepancyType === 'record_not_physical'
        ? 'Incoming in-transit parcel exists in system but is not physical'
        : 'Incoming in-transit parcel is physical but missing in the system',
    metadata: {
      branchId: input.branchId ?? parcel?.destinationId ?? null,
      parcelId: input.parcelId ?? null,
      trackingCode: input.trackingCode ?? parcel?.trackingCode ?? null,
      bookingCode: input.bookingCode ?? parcel?.bookingCode ?? null,
      discrepancyType: input.discrepancyType,
      notes: input.notes?.trim() || null,
      parcelStatus: parcel?.status ?? null,
      destinationId: parcel?.destinationId ?? null,
      sourceId: parcel?.sourceId ?? null,
    },
  });

  return { success: true };
}
