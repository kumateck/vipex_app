import { ParcelStatus } from '@/db/schemas/enums';
import { Conflict, NotFound, Unauthorized } from '@/server/utils/http-error';
import { generateOpaqueToken, generateOtpCode, hashOtp } from '@/server/utils/otp';
import { getParcelSvc } from '../shipments/parcels.service';
import { getParcelRecipientsRepo } from '../notification-hub/repository';
import { dispatchSmsEventSvc } from '../notification-hub/service';
import {
  consumeOtpTokenRepo,
  createParcelReceiverOtpRepo,
  getActiveParcelReceiverOtpRepo,
  getVerifiedOtpByTokenRepo,
  incrementOtpAttemptsRepo,
  markOtpVerifiedRepo,
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

async function resolveTargetPhone(
  companyId: string,
  parcelId: string,
  targetReceiver: TargetReceiver,
) {
  const recipients = await getParcelRecipientsRepo(companyId, parcelId);
  if (!recipients) throw NotFound('Parcel not found');

  const target = targetReceiver === 'second' ? recipients.secondary : recipients.primary;
  if (!target?.phone) {
    throw Conflict(
      targetReceiver === 'second'
        ? 'Second receiver has no phone on file'
        : 'Receiver has no phone on file',
    );
  }

  return { phone: target.phone, name: target.name ?? 'Customer' };
}

export async function requestReceiverOtpSvc(input: {
  companyId: string;
  branchId: string;
  parcelId: string;
  targetReceiver: TargetReceiver;
  requestedBy: string;
  force?: boolean;
}) {
  await assertOfficePickupParcel(input.parcelId);
  const { phone, name } = await resolveTargetPhone(
    input.companyId,
    input.parcelId,
    input.targetReceiver,
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
    otpHash,
    expiresAt,
    createdBy: input.requestedBy,
  });

  if (!created) throw Conflict('Unable to create OTP right now. Please retry.');

  await dispatchSmsEventSvc({
    companyId: input.companyId,
    eventCode: 'receiver_pickup_otp',
    phone,
    recipientType: input.targetReceiver === 'second' ? 'second_receiver' : 'receiver',
    recipientName: name,
    variables: {
      receiverName: name,
      otp,
      expiresInMinutes: 5,
    },
    metadataJson: {
      parcelId: input.parcelId,
      targetReceiver: input.targetReceiver,
    },
  });

  return { expiresAt: expiresAt.toISOString() };
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
