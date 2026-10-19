import { requireOtpSmsDelivery, type OtpDeliveryChannel } from './otp-sms-delivery';
import { ParcelStatus } from '@/db/schemas/enums';
import { BadRequest, Conflict, NotFound, Unauthorized } from '@/server/utils/http-error';
import { generateOpaqueToken, generateOtpCode, hashOtp } from '@/server/utils/otp';
import { getParcelSvc } from '../shipments/parcels.service';
import { getParcelRecipientsRepo } from '../notification-hub/repository';
import { dispatchSmsEventSvc, dispatchWhatsAppEventSvc } from '../notification-hub/service';
import { getWhatsAppAvailabilitySvc } from '../whatsapp-messaging/availability.service';
import {
  consumeOtpTokenRepo,
  createParcelReceiverOtpRepo,
  expireFailedParcelReceiverOtpRepo,
  getActiveParcelReceiverOtpRepo,
  getVerifiedOtpByTokenRepo,
  incrementOtpAttemptsRepo,
  markOtpVerifiedRepo,
  type PhoneSlot,
  type TargetReceiver,
} from './repository';

const OTP_TTL_MS = 5 * 60 * 1000;
const VERIFICATION_TOKEN_TTL_MS = 10 * 60 * 1000;

async function assertOfficePickupParcel(parcelId: string) {
  const parcel = await getParcelSvc(parcelId);
  if (parcel.status !== ParcelStatus.AWAITING_PICKUP) {
    throw Conflict('Receiver OTP verification is only available for parcels awaiting pickup');
  }
  return parcel;
}

async function assertWhatsAppAvailable(companyId: string) {
  const availability = await getWhatsAppAvailabilitySvc(companyId);
  if (!availability.moduleEnabled) {
    throw BadRequest('WhatsApp Messaging is not enabled for this company');
  }
  if (!availability.configured) {
    throw BadRequest('WhatsApp is not configured. Complete WhatsApp Settings or send by SMS.');
  }
}

async function resolveTargetPhone(
  companyId: string,
  parcelId: string,
  targetReceiver: TargetReceiver,
  phoneSlot: PhoneSlot = 'primary',
) {
  const recipients = await getParcelRecipientsRepo(companyId, parcelId);
  if (!recipients) throw NotFound('Parcel not found');

  const target = targetReceiver === 'second' ? recipients.secondary : recipients.primary;
  // The secondary-phone choice only applies to the main receiver — the
  // second receiver's own record doesn't offer a phone-slot choice here.
  const phone =
    targetReceiver === 'main' && phoneSlot === 'secondary'
      ? recipients.primary?.phone2
      : target?.phone;

  if (!phone) {
    throw Conflict(
      targetReceiver === 'second'
        ? 'Second receiver has no phone on file'
        : phoneSlot === 'secondary'
          ? 'Receiver has no second phone on file'
          : 'Receiver has no phone on file',
    );
  }

  return {
    phone,
    name: target?.name ?? 'Customer',
    branch: recipients.branch,
    location: recipients.location,
  };
}

export async function requestReceiverOtpSvc(input: {
  companyId: string;
  branchId: string;
  parcelId: string;
  targetReceiver: TargetReceiver;
  requestedBy: string;
  force?: boolean;
  phoneSlot?: PhoneSlot;
  channel?: OtpDeliveryChannel;
}) {
  const channel = input.channel ?? 'sms';
  await assertOfficePickupParcel(input.parcelId);
  if (channel === 'whatsapp') await assertWhatsAppAvailable(input.companyId);
  const { phone, name, branch, location } = await resolveTargetPhone(
    input.companyId,
    input.parcelId,
    input.targetReceiver,
    input.phoneSlot,
  );

  const existing = await getActiveParcelReceiverOtpRepo(input.parcelId, input.targetReceiver);
  if (existing && !input.force) {
    throw Conflict(
      `An active OTP already exists and expires at ${existing.expiresAt.toISOString()}. Use force=true to resend.`,
    );
  }

  const otp = generateOtpCode();
  const otpHash = await hashOtp(input.parcelId, otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  const created = await createParcelReceiverOtpRepo({
    companyId: input.companyId,
    branchId: input.branchId,
    parcelId: input.parcelId,
    targetReceiver: input.targetReceiver,
    phone,
    channel,
    otpHash,
    expiresAt,
    createdBy: input.requestedBy,
  });

  if (!created) throw Conflict('Unable to create OTP right now. Please retry.');

  const recipient = {
    companyId: input.companyId,
    phone,
    recipientType: input.targetReceiver === 'second' ? 'second_receiver' : 'receiver',
    recipientName: name,
    variables: { receiverName: name, otp, expiresInMinutes: 5, branch, location },
    metadataJson: {
      parcelId: input.parcelId,
      targetReceiver: input.targetReceiver,
      phoneSlot: input.phoneSlot ?? 'primary',
      channel,
    },
  };

  await requireOtpSmsDelivery({
    channel,
    expireFailedOtp: () => expireFailedParcelReceiverOtpRepo(created.id),
    send: () =>
      channel === 'whatsapp'
        ? dispatchWhatsAppEventSvc({ ...recipient, eventCode: 'receiver_pickup_otp' })
        : dispatchSmsEventSvc({ ...recipient, eventCode: 'receiver_pickup_otp' }),
  });

  return { expiresAt: expiresAt.toISOString(), channel };
}

export async function verifyReceiverOtpSvc(input: {
  companyId: string;
  parcelId: string;
  targetReceiver: TargetReceiver;
  otp: string;
}) {
  const active = await getActiveParcelReceiverOtpRepo(input.parcelId, input.targetReceiver);
  if (!active) {
    throw Conflict('No active OTP found. Please request a new one.');
  }
  if (active.attempts >= active.maxAttempts) {
    throw Conflict('Too many failed attempts. Please request a new OTP.');
  }

  const candidateHash = await hashOtp(input.parcelId, input.otp);
  if (candidateHash !== active.otpHash) {
    await incrementOtpAttemptsRepo(active.id);
    throw Unauthorized('Invalid OTP');
  }

  const verificationToken = generateOpaqueToken(24);
  const verificationTokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  await markOtpVerifiedRepo(active.id, { verificationToken, verificationTokenExpiresAt });

  return {
    verificationToken,
    expiresAt: verificationTokenExpiresAt.toISOString(),
  };
}

export async function assertReceiverOtpVerifiedSvc(input: {
  parcelId: string;
  targetReceiver: TargetReceiver;
  verificationToken: string;
}) {
  const verified = await getVerifiedOtpByTokenRepo(
    input.parcelId,
    input.targetReceiver,
    input.verificationToken,
  );
  if (!verified) {
    throw Unauthorized('Receiver OTP verification required or expired. Please re-verify.');
  }
  return verified;
}

export async function consumeReceiverOtpTokenSvc(id: string) {
  await consumeOtpTokenRepo(id);
}
