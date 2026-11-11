import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, ParcelStatus } from '@/db/schemas';
import { BadRequest, NotFound } from '@/server/utils/http-error';
import type { ReceiverOtpSession } from '@/shared/shipments/receiver-otp-session';
import type { TargetReceiver } from './repository';
import { getResumableReceiverOtp } from './session.repository';

export async function getReceiverOtpSession(input: {
  companyId: string;
  branchId: string;
  actorUserId: string;
  parcelId: string;
  targetReceiver: TargetReceiver;
}): Promise<ReceiverOtpSession | null> {
  if (!input.companyId || !input.branchId) throw BadRequest('Company and branch are required');
  const [parcel] = await db
    .select({ status: parcels.status })
    .from(parcels)
    .where(
      and(
        eq(parcels.id, input.parcelId),
        eq(parcels.companyId, input.companyId),
        eq(parcels.destinationId, input.branchId),
        eq(parcels.isDeleted, false),
      ),
    )
    .limit(1);
  if (!parcel) throw NotFound('Parcel not found at your branch');
  if (parcel.status !== ParcelStatus.AWAITING_PICKUP) return null;
  const otp = await getResumableReceiverOtp(
    input.parcelId,
    input.targetReceiver,
    input.actorUserId,
  );
  if (!otp) return null;
  const verified = Boolean(
    otp.verifiedAt && otp.verificationToken && otp.verificationTokenExpiresAt,
  );
  return {
    sentAt: otp.createdAt.toISOString(),
    expiresAt: (verified ? otp.verificationTokenExpiresAt! : otp.expiresAt).toISOString(),
    channel: otp.channel === 'whatsapp' ? 'whatsapp' : 'sms',
    phoneSlot: otp.phoneSlot,
    verificationToken: verified ? otp.verificationToken : null,
  };
}
