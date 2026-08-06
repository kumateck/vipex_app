import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcelReceiverOtps } from '@/db/schemas';

export type TargetReceiver = 'main' | 'second';

export async function createParcelReceiverOtpRepo(values: typeof parcelReceiverOtps.$inferInsert) {
  const [row] = await db.insert(parcelReceiverOtps).values(values).returning();
  return row ?? null;
}

export async function getActiveParcelReceiverOtpRepo(
  parcelId: string,
  targetReceiver: TargetReceiver,
) {
  const [row] = await db
    .select()
    .from(parcelReceiverOtps)
    .where(
      and(
        eq(parcelReceiverOtps.parcelId, parcelId),
        eq(parcelReceiverOtps.targetReceiver, targetReceiver),
        isNull(parcelReceiverOtps.verifiedAt),
        gt(parcelReceiverOtps.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(parcelReceiverOtps.createdAt))
    .limit(1);

  return row ?? null;
}

export async function incrementOtpAttemptsRepo(id: string) {
  const [row] = await db
    .update(parcelReceiverOtps)
    .set({ attempts: sql`${parcelReceiverOtps.attempts} + 1` })
    .where(eq(parcelReceiverOtps.id, id))
    .returning({ attempts: parcelReceiverOtps.attempts });

  return row ?? null;
}

export async function markOtpVerifiedRepo(
  id: string,
  input: { verificationToken: string; verificationTokenExpiresAt: Date },
) {
  const [row] = await db
    .update(parcelReceiverOtps)
    .set({
      verifiedAt: new Date(),
      verificationToken: input.verificationToken,
      verificationTokenExpiresAt: input.verificationTokenExpiresAt,
    })
    .where(eq(parcelReceiverOtps.id, id))
    .returning();

  return row ?? null;
}

export async function getVerifiedOtpByTokenRepo(
  parcelId: string,
  targetReceiver: TargetReceiver,
  token: string,
) {
  const [row] = await db
    .select()
    .from(parcelReceiverOtps)
    .where(
      and(
        eq(parcelReceiverOtps.parcelId, parcelId),
        eq(parcelReceiverOtps.targetReceiver, targetReceiver),
        eq(parcelReceiverOtps.verificationToken, token),
        gt(parcelReceiverOtps.verificationTokenExpiresAt, new Date()),
      ),
    )
    .orderBy(desc(parcelReceiverOtps.createdAt))
    .limit(1);

  return row ?? null;
}

export async function consumeOtpTokenRepo(id: string) {
  await db
    .update(parcelReceiverOtps)
    .set({ verificationToken: null, verificationTokenExpiresAt: null })
    .where(eq(parcelReceiverOtps.id, id));
}
