import { and, desc, eq, gt, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcelReceiverOtps } from '@/db/schemas';
import { currentReceiverPhone, type TargetReceiver } from './repository';

export async function getResumableReceiverOtp(
  parcelId: string,
  targetReceiver: TargetReceiver,
  actorUserId: string,
) {
  const now = new Date();
  const [row] = await db
    .select({
      createdAt: parcelReceiverOtps.createdAt,
      expiresAt: parcelReceiverOtps.expiresAt,
      channel: parcelReceiverOtps.channel,
      verifiedAt: parcelReceiverOtps.verifiedAt,
      verificationToken: parcelReceiverOtps.verificationToken,
      verificationTokenExpiresAt: parcelReceiverOtps.verificationTokenExpiresAt,
      phoneSlot: sql<
        'primary' | 'secondary'
      >`case when ${parcelReceiverOtps.targetReceiver} = 'main' and exists (
      select 1 from parcels p join customers c on c.id=p.receiver_id and c.company_id=p.company_id
      where p.id=${parcelReceiverOtps.parcelId} and c.telephone2=${parcelReceiverOtps.phone}
    ) then 'secondary' else 'primary' end`,
    })
    .from(parcelReceiverOtps)
    .where(
      and(
        eq(parcelReceiverOtps.parcelId, parcelId),
        eq(parcelReceiverOtps.targetReceiver, targetReceiver),
        currentReceiverPhone,
        or(
          and(isNull(parcelReceiverOtps.verifiedAt), gt(parcelReceiverOtps.expiresAt, now)),
          and(
            eq(parcelReceiverOtps.createdBy, actorUserId),
            isNotNull(parcelReceiverOtps.verifiedAt),
            isNotNull(parcelReceiverOtps.verificationToken),
            gt(parcelReceiverOtps.verificationTokenExpiresAt, now),
          ),
        ),
      ),
    )
    .orderBy(desc(parcelReceiverOtps.createdAt), desc(parcelReceiverOtps.id))
    .limit(1);
  return row ?? null;
}
