import { env } from '@/server/utils/env';
import { generateOpaqueToken, sha256HexAsync } from '@/server/utils/otp';
import { Conflict } from '@/server/utils/http-error';
import {
  isDigitalReceiptChannel,
  normalizeReceiptChannels,
  type DigitalReceiptChannel,
  type ReceiptKind,
} from '@/shared/digital-receipts/channels';
import { dispatchSmsEventSvc, dispatchWhatsAppEventSvc } from '../notification-hub/service';
import type { DeliveryResult } from '../notification-hub/types';
import { getWhatsAppAvailabilitySvc } from '../whatsapp-messaging/availability.service';
import { sendReceiptEmailSvc } from './email-delivery.service';
import {
  RECEIPT_KIND_LABEL,
  SMS_EVENT_BY_KIND,
  buildReceiptMessageVariables,
} from './message-summary';
import { buildReceiptSvc } from './receipt-document.service';
import { resolveReceiptRecipients, type ReceiptRecipient } from './recipients';
import { getParcelReceiptPartiesRepo, createReceiptShareLinkRepo } from './repository';

export const RECEIPT_LINK_TTL_DAYS = 180;

export type ReceiptSendResult = {
  role: ReceiptRecipient['role'];
  name: string;
  channel: DigitalReceiptChannel;
  status: 'sent' | 'failed' | 'skipped';
  detail: string | null;
};

export async function loadReceiptRecipientsSvc(
  companyId: string,
  parcelId: string,
  kind: ReceiptKind,
) {
  const parties = await getParcelReceiptPartiesRepo(companyId, parcelId);
  if (!parties) return [];
  return resolveReceiptRecipients(
    kind,
    {
      sender: parties.senderId
        ? {
            customerId: parties.senderId,
            name: parties.senderName,
            phone: parties.senderPhone,
            email: parties.senderEmail,
          }
        : null,
      receiver: parties.receiverId
        ? {
            customerId: parties.receiverId,
            name: parties.receiverName,
            phone: parties.receiverPhone,
            email: parties.receiverEmail,
          }
        : null,
    },
    // The sender paid part of the charge unless the receiver was to pay it all.
    { senderPaid: Number(parties.chargePsw) > Number(parties.plannedToBePaidPsw) },
  );
}

async function deliver(
  channel: DigitalReceiptChannel,
  recipient: ReceiptRecipient,
  context: {
    companyId: string;
    kind: ReceiptKind;
    variables: ReturnType<typeof buildReceiptMessageVariables>;
    metadataJson: Record<string, unknown>;
  },
): Promise<DeliveryResult | null> {
  const base = {
    companyId: context.companyId,
    recipientType: recipient.role,
    recipientId: recipient.customerId,
    recipientName: recipient.name,
    variables: context.variables,
    metadataJson: { ...context.metadataJson, channel },
  };
  const eventCode = SMS_EVENT_BY_KIND[context.kind];
  if (channel === 'email') {
    if (!recipient.email) return null;
    return sendReceiptEmailSvc({
      ...base,
      to: recipient.email,
      title: RECEIPT_KIND_LABEL[context.kind],
      metadataJson: base.metadataJson,
    });
  }
  if (!recipient.phone) return null;
  return channel === 'whatsapp'
    ? dispatchWhatsAppEventSvc({ ...base, eventCode, phone: recipient.phone })
    : dispatchSmsEventSvc({ ...base, eventCode, phone: recipient.phone });
}

/**
 * Sends a digital receipt over the chosen channels. Creates one share link,
 * builds the same receipt the counter prints (to quote its figures), and
 * reports a result per recipient and channel. Never throws for a single
 * channel failure — each one is logged in the notification dispatch history.
 */
export async function sendDigitalReceiptSvc(input: {
  companyId: string;
  actorUserId: string;
  parcelId: string;
  kind: ReceiptKind;
  channels: string[];
}) {
  const requested = normalizeReceiptChannels(input.channels).filter(isDigitalReceiptChannel);
  if (!requested.length) throw Conflict('Choose at least one of SMS, WhatsApp or email');

  const [receipt, recipients, whatsapp] = await Promise.all([
    buildReceiptSvc({ ...input, issuedAt: new Date() }),
    loadReceiptRecipientsSvc(input.companyId, input.parcelId, input.kind),
    requested.includes('whatsapp') ? getWhatsAppAvailabilitySvc(input.companyId) : null,
  ]);

  const token = generateOpaqueToken();
  const link = await createReceiptShareLinkRepo({
    companyId: input.companyId,
    parcelId: input.parcelId,
    kind: input.kind,
    tokenHash: await sha256HexAsync(token),
    expiresAt: new Date(Date.now() + RECEIPT_LINK_TTL_DAYS * 24 * 60 * 60 * 1000),
    createdBy: input.actorUserId,
  });
  if (!link) throw Conflict('Unable to create the receipt link. Please retry.');
  const url = `${env.PUBLIC_RECEIPT_BASE_URL.replace(/\/+$/, '')}/${token}`;

  const results: ReceiptSendResult[] = [];
  for (const recipient of recipients) {
    const variables = buildReceiptMessageVariables({
      recipientName: recipient.name,
      bookingCode: receipt.bookingCode,
      summary: receipt.summary,
      token,
      url,
    });
    for (const channel of requested) {
      const row = { role: recipient.role, name: recipient.name, channel };
      if (channel === 'whatsapp' && !whatsapp?.available) {
        results.push({
          ...row,
          status: 'skipped',
          detail: 'WhatsApp is not enabled or configured',
        });
        continue;
      }
      const result = await deliver(channel, recipient, {
        companyId: input.companyId,
        kind: input.kind,
        variables,
        metadataJson: { parcelId: input.parcelId, kind: input.kind, shareLinkId: link.id },
      });
      results.push(
        result
          ? { ...row, status: result.status, detail: result.errorMessage ?? null }
          : {
              ...row,
              status: 'skipped',
              detail: channel === 'email' ? 'No email on file' : 'No phone on file',
            },
      );
    }
  }

  return { shareLinkId: link.id, url, expiresAt: link.expiresAt.toISOString(), results };
}
