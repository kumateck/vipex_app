import { ParcelStatus } from '@/db/schemas';
import { db } from '@/db/config';
import { BadRequest, NotFound } from '../../../utils/http-error';
import { listAllPaymentsForParcelRepo, softVoidPaymentsByIdsRepo } from '../../payments/repository';
import { recordAuditLog } from '../../audit/logger';
import { updateParcelRepo } from '../parcels.repository';
import { getParcelSvc } from './queries';

export async function softDeleteParcelSvc(input: {
  parcelId: string;
  actorUserId: string;
  reason: string;
}) {
  const reason = input.reason.trim();
  if (!reason) {
    throw BadRequest('Deletion reason is required');
  }

  return db.transaction(async (tx) => {
    const parcel = await getParcelSvc(input.parcelId, tx);
    if (parcel.isDeleted) {
      throw BadRequest('Parcel is already deleted');
    }
    if (
      parcel.status !== ParcelStatus.CREATED &&
      parcel.status !== ParcelStatus.PROCESSED &&
      parcel.status !== ParcelStatus.CANCELLED
    ) {
      throw BadRequest('Only created, processed, or cancelled parcels can be deleted');
    }

    const allPayments = await listAllPaymentsForParcelRepo(input.parcelId, tx);
    const activePaymentIds = allPayments
      .filter((payment) => !payment.voidedAt)
      .map((payment) => payment.id);

    const voidedNow = await softVoidPaymentsByIdsRepo(
      activePaymentIds,
      input.actorUserId,
      reason,
      tx,
    );

    const updated = await updateParcelRepo(
      input.parcelId,
      {
        isDeleted: true,
        deletedBy: input.actorUserId,
        deletedAt: new Date(),
        deleteReason: reason,
      },
      tx,
    );
    if (!updated) {
      throw NotFound('Parcel not found');
    }

    const refreshedPayments = await listAllPaymentsForParcelRepo(input.parcelId, tx);
    const totalPayments = refreshedPayments.length;
    const totalVoidedPayments = refreshedPayments.filter((payment) =>
      Boolean(payment.voidedAt),
    ).length;
    const allPaymentsVoided = totalPayments > 0 ? totalVoidedPayments === totalPayments : true;

    await recordAuditLog({
      companyId: parcel.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel',
      entityId: parcel.id,
      action: 'PARCEL_SOFT_DELETED',
      message: `Parcel ${parcel.trackingCode} soft-deleted`,
      metadata: {
        reason,
        bookingCode: parcel.bookingCode,
        trackingCode: parcel.trackingCode,
        statusAtDelete: parcel.status,
        paymentSummary: {
          totalPayments,
          voidedNow,
          totalVoidedPayments,
          allPaymentsVoided,
        },
      },
    });

    return {
      id: parcel.id,
      bookingCode: parcel.bookingCode,
      trackingCode: parcel.trackingCode,
      reason,
      payments: {
        total: totalPayments,
        voidedNow,
        totalVoided: totalVoidedPayments,
        allVoided: allPaymentsVoided,
      },
    };
  });
}
