import type { ReceiverOtpSession } from '@/shared/shipments/receiver-otp-session';

export const sessions = new Map<string, ReceiverOtpSession>();
export const sends: string[] = [];
export const verifications: string[] = [];
export let loadSession = async (id: string): Promise<ReceiverOtpSession | null> =>
  sessions.get(id) ?? null;
export function setSessionLoader(load: typeof loadSession) {
  loadSession = load;
}
export function resetOtpTransport() {
  sessions.clear();
  sends.length = 0;
  verifications.length = 0;
  loadSession = async (id) => sessions.get(id) ?? null;
}
export async function sendOtp(input: {
  parcelId: string;
  channel?: 'sms' | 'whatsapp';
  phoneSlot?: 'primary' | 'secondary';
}) {
  const session: ReceiverOtpSession = {
    sentAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 600000).toISOString(),
    channel: input.channel ?? 'sms',
    phoneSlot: input.phoneSlot ?? 'primary',
    verificationToken: null,
  };
  sessions.set(input.parcelId, session);
  sends.push(input.parcelId);
  return { expiresAt: session.expiresAt, channel: session.channel };
}
export async function verifyOtp(input: { parcelId: string; otp: string }) {
  if (input.otp !== '123456' || !sessions.has(input.parcelId)) throw new Error('Invalid OTP');
  const verificationToken = `proof-${input.parcelId}`;
  const expiresAt = new Date(Date.now() + 600000).toISOString();
  sessions.set(input.parcelId, { ...sessions.get(input.parcelId)!, verificationToken, expiresAt });
  verifications.push(input.parcelId);
  return { verificationToken, expiresAt };
}
