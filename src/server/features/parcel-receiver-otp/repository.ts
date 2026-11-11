import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcelReceiverOtps } from '@/db/schemas';

type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type TargetReceiver = 'main' | 'second';
export type PhoneSlot = 'primary' | 'secondary';

// A code or token issued before a customer correction must still belong to a
// telephone on the parcel's current linked receiver, including after a racing resend.
export const currentReceiverPhone = sql`exists (
  select 1 from parcels p
  join customers c on c.id = case
    when ${parcelReceiverOtps.targetReceiver} = 'main' then p.receiver_id
    when ${parcelReceiverOtps.targetReceiver} = 'second' then p.second_receiver_id
  end
  where p.id = ${parcelReceiverOtps.parcelId}
    and p.company_id = ${parcelReceiverOtps.companyId}
    and c.company_id = p.company_id and not p.is_deleted and not c.is_deleted
    and (${parcelReceiverOtps.phone} = c.telephone or (
      ${parcelReceiverOtps.targetReceiver} = 'main' and ${parcelReceiverOtps.phone} = c.telephone2
    ))
)`;

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
        currentReceiverPhone,
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
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select()
    .from(parcelReceiverOtps)
    .where(
      and(
        eq(parcelReceiverOtps.parcelId, parcelId),
        eq(parcelReceiverOtps.targetReceiver, targetReceiver),
        eq(parcelReceiverOtps.verificationToken, token),
        gt(parcelReceiverOtps.verificationTokenExpiresAt, new Date()),
        currentReceiverPhone,
      ),
    )
    .orderBy(desc(parcelReceiverOtps.createdAt))
    .limit(1);

  return row ?? null;
}

export async function consumeOtpTokenRepo(id: string, executor: DbExecutor = db) {
  await executor
    .update(parcelReceiverOtps)
    .set({ verificationToken: null, verificationTokenExpiresAt: null })
    .where(eq(parcelReceiverOtps.id, id));
}

export async function expireFailedParcelReceiverOtpRepo(id: string) {
  await db
    .update(parcelReceiverOtps)
    .set({
      expiresAt: new Date(),
      verificationToken: null,
      verificationTokenExpiresAt: null,
    })
    .where(eq(parcelReceiverOtps.id, id));
}
