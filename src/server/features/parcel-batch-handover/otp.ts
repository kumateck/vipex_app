import { and, eq, gt, isNotNull, isNull, like, lt, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcelReceiverOtps } from '@/db/schemas';
import {
  BATCH_OTP_RESEND_SECONDS,
  type BatchOtpRequest,
  type BatchOtpVerify,
} from '@/shared/shipments/parcel-batch-handover';
import { RECEIVER_OTP_EXPIRY_MINUTES } from '@/shared/shipments/receiver-otp-session';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { generateOpaqueToken, generateOtpCode, hashOtp } from '@/server/utils/otp';
import { assertActiveSessionSvc } from '../cashiers/service';
import { getParcelRecipientsRepo } from '../notification-hub/repository';
import { dispatchSmsEventSvc, dispatchWhatsAppEventSvc } from '../notification-hub/service';
import { requireOtpSmsDelivery } from '../parcel-receiver-otp/otp-sms-delivery';
import { expireFailedParcelReceiverOtpRepo } from '../parcel-receiver-otp/repository';
import { getWhatsAppAvailabilitySvc } from '../whatsapp-messaging/availability.service';
import type { DbExecutor } from '../shipments/parcel-repositories/parcel-repository.types';
import { checkBatchQuote } from './eligibility';
import {
  batchSelectionKey,
  batchTelephone,
  getBatchBranch,
  getBatchMembers,
  type BatchActor,
} from './selection';

const RESEND_MS = BATCH_OTP_RESEND_SECONDS * 1000;
const OTP_TTL_MS = RECEIVER_OTP_EXPIRY_MINUTES * 60_000;

export async function requestBatchOtp(actor: BatchActor, input: BatchOtpRequest) {
  const batchScope = await batchSelectionKey(actor, input);
  const phone = batchTelephone(input.telephone);
  const [branch, members, whatsapp] = await Promise.all([
    getBatchBranch(actor),
    getBatchMembers(actor, input),
    input.channel === 'whatsapp' ? getWhatsAppAvailabilitySvc(actor.companyId) : null,
    actor.workflow === 'receiver-cashier'
      ? assertActiveSessionSvc({ cashierId: actor.actorId, branchId: actor.branchId })
      : null,
  ]);
  if (whatsapp && (!whatsapp.moduleEnabled || !whatsapp.configured))
    throw BadRequest('WhatsApp is unavailable. Send the OTP by SMS.');
  await Promise.all(members.map((member) => checkBatchQuote(actor, member, branch.usePickupQueue)));
  const first = members[0]!;
  const recipients = await getParcelRecipientsRepo(actor.companyId, first.parcel.id);
  if (!recipients) throw NotFound('The first selected parcel is no longer available');
  const otp = generateOtpCode();
  const otpHash = await hashOtp(batchScope, otp);
  const created = await db.transaction(async (tx) => {
    const phoneScope = `batch-otp:${actor.companyId}:${actor.branchId}:${phone}`;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${phoneScope}, 0))`);
    const now = new Date();
    const [recent] = await tx
      .select({ id: parcelReceiverOtps.id })
      .from(parcelReceiverOtps)
      .where(
        and(
          eq(parcelReceiverOtps.companyId, actor.companyId),
          eq(parcelReceiverOtps.branchId, actor.branchId),
          eq(parcelReceiverOtps.phone, phone),
          isNotNull(parcelReceiverOtps.batchScope),
          gt(parcelReceiverOtps.createdAt, new Date(now.getTime() - RESEND_MS)),
          gt(parcelReceiverOtps.expiresAt, now),
          isNull(parcelReceiverOtps.batchCompletedAt),
        ),
      )
      .limit(1);
    if (recent)
      throw Conflict(
        `Wait ${BATCH_OTP_RESEND_SECONDS} seconds between OTP requests to this receiver.`,
      );
    const [row] = await tx
      .insert(parcelReceiverOtps)
      .values({
        companyId: actor.companyId,
        branchId: actor.branchId,
        parcelId: first.parcel.id,
        targetReceiver: 'main',
        phone,
        channel: input.channel,
        batchScope,
        otpHash,
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
        createdBy: actor.actorId,
        createdAt: now,
      })
      .returning();
    return row!;
  });

  const message = {
    companyId: actor.companyId,
    phone,
    recipientType: 'receiver',
    recipientName: first.receiver.name,
    eventCode: 'receiver_pickup_otp' as const,
    variables: {
      receiverName: first.receiver.name,
      otp,
      expiresInMinutes: RECEIVER_OTP_EXPIRY_MINUTES,
      branch: recipients.branch,
      location: recipients.location,
      locationPhone: recipients.locationPhone,
    },
    metadataJson: { batchId: created.id, parcelIds: members.map(({ parcel }) => parcel.id) },
  };
  await requireOtpSmsDelivery({
    channel: input.channel,
    expireFailedOtp: () => expireFailedParcelReceiverOtpRepo(created.id),
    send: () =>
      input.channel === 'whatsapp'
        ? dispatchWhatsAppEventSvc(message)
        : dispatchSmsEventSvc(message),
  });
  await db
    .update(parcelReceiverOtps)
    .set({ expiresAt: new Date(), verificationToken: null, verificationTokenExpiresAt: null })
    .where(
      and(
        eq(parcelReceiverOtps.batchScope, batchScope),
        eq(parcelReceiverOtps.createdBy, actor.actorId),
        lt(parcelReceiverOtps.createdAt, created.createdAt),
        isNull(parcelReceiverOtps.batchCompletedAt),
      ),
    );
  return {
    id: created.id,
    expiresAt: created.expiresAt.toISOString(),
    resendAt: new Date(created.createdAt.getTime() + RESEND_MS).toISOString(),
  };
}

export async function lockBatchOtp(actor: BatchActor, id: string, tx: DbExecutor) {
  const [row] = await tx
    .select()
    .from(parcelReceiverOtps)
    .where(
      and(
        eq(parcelReceiverOtps.id, id),
        eq(parcelReceiverOtps.companyId, actor.companyId),
        eq(parcelReceiverOtps.branchId, actor.branchId),
        eq(parcelReceiverOtps.createdBy, actor.actorId),
        like(parcelReceiverOtps.batchScope, `${actor.workflow}:%`),
      ),
    )
    .for('update');
  if (!row?.batchScope) throw NotFound('Pickup OTP session not found. Request a new OTP.');
  return { ...row, batchScope: row.batchScope };
}

export async function verifyBatchOtp(actor: BatchActor, input: BatchOtpVerify) {
  const result = await db.transaction(async (tx) => {
    const batch = await lockBatchOtp(actor, input.id, tx);
    if (batch.batchCompletedAt || batch.expiresAt.getTime() <= Date.now())
      throw Conflict('This OTP session has ended. Request a new OTP.');
    if (batch.attempts >= batch.maxAttempts)
      throw Conflict('Too many failed attempts. Request a new OTP.');
    if ((await hashOtp(batch.batchScope, input.otp)) !== batch.otpHash) {
      await tx
        .update(parcelReceiverOtps)
        .set({ attempts: batch.attempts + 1 })
        .where(eq(parcelReceiverOtps.id, batch.id));
      return null;
    }
    if (batch.verificationToken && batch.verificationTokenExpiresAt)
      return {
        verificationToken: batch.verificationToken,
        expiresAt: batch.verificationTokenExpiresAt.toISOString(),
      };
    const verificationToken = generateOpaqueToken(24);
    const verifiedAt = new Date();
    const expiresAt = new Date(verifiedAt.getTime() + OTP_TTL_MS);
    await tx
      .update(parcelReceiverOtps)
      .set({ verificationToken, verifiedAt, verificationTokenExpiresAt: expiresAt })
      .where(eq(parcelReceiverOtps.id, batch.id));
    return { verificationToken, expiresAt: expiresAt.toISOString() };
  });
  if (!result) throw BadRequest('Invalid OTP');
  return result;
}
