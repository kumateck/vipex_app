import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { sendMail } from '@/server/services/mail/mailer';
import { buildDigitalReceiptEmail } from '@/server/services/mail/templates/digital-receipt';
import {
  createNotificationDispatchRepo,
  updateNotificationDispatchResultRepo,
} from '../notification-hub/repository';
import type { DeliveryResult } from '../notification-hub/types';
import type { ReceiptMessageVariables } from './message-summary';

/**
 * Receipt emails go through the platform SMTP transport (same as account
 * emails) and are logged in the notification dispatch history.
 */
export async function sendReceiptEmailSvc(input: {
  companyId: string;
  to: string;
  recipientType: string;
  recipientId: string | null;
  recipientName: string;
  title: string;
  variables: ReceiptMessageVariables;
  metadataJson: Record<string, unknown>;
}): Promise<DeliveryResult> {
  const email = buildDigitalReceiptEmail({
    title: input.title,
    customerName: input.variables.customerName,
    bookingCode: input.variables.bookingCode,
    amountPaid: input.variables.amountPaid,
    balance: input.variables.balance,
    destination: input.variables.destination,
    receiptUrl: input.variables.receiptUrl,
  });
  const dispatch = await createNotificationDispatchRepo({
    companyId: input.companyId,
    campaignId: null,
    channel: 'email',
    providerId: null,
    providerKey: 'smtp',
    recipientType: input.recipientType,
    recipientId: input.recipientId,
    recipientName: input.recipientName,
    recipientAddress: input.to,
    subject: email.subject,
    body: email.text,
    status: 'pending',
    attemptCount: 0,
    metadataJson: input.metadataJson,
  });
  if (!dispatch) return { status: 'failed', errorMessage: 'Failed to create dispatch record' };

  let result: DeliveryResult;
  try {
    const info = await sendMail({ to: input.to, ...email });
    result = { status: 'sent', providerMessageId: info.messageId ?? null };
  } catch (error) {
    result = {
      status: 'failed',
      errorMessage: getErrorMessage(error, '') || 'Failed to send email',
    };
  }
  await updateNotificationDispatchResultRepo(dispatch.id, input.companyId, {
    status: result.status,
    attemptCount: 1,
    providerMessageId: result.providerMessageId ?? null,
    errorMessage: result.errorMessage ?? null,
  });
  return result;
}
