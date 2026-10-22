import { NotFound } from '@/server/utils/http-error';
import type { ParcelCallNotificationFailure } from '@/shared/notification-hub';
import { recordAuditLog } from '../../audit/logger';
import {
  createNotificationDispatchRepo,
  getDefaultProviderByChannelRepo,
  getParcelRecipientsRepo,
} from '../repository';
import { getParcelStatusSmsEventCode } from '../sms-event-definitions';
import { dispatchSmsEventSvc } from './sms-events.service';
import { dispatchSingleMessage } from './dispatch-message.service';
import { buildParcelNotificationFailure } from '../utils';
function buildCallCenterMessage(input: {
  outcome: string;
  trackingCode: string;
  bookingCode: string;
  recipientName: string;
}) {
  const label = input.recipientName.trim() || 'Customer';
  const tracking = input.trackingCode;
  const booking = input.bookingCode;
  const outcome = input.outcome.trim().toLowerCase();

  if (outcome === 'pickup') {
    return `${label}, your parcel ${tracking} (booking ${booking}) is ready for pickup.`;
  }
  if (outcome === 'delivery') {
    return `${label}, your parcel ${tracking} (booking ${booking}) has been marked for delivery dispatch.`;
  }
  if (outcome === 'follow_up') {
    return `${label}, thank you. We will follow up on parcel ${tracking} (booking ${booking}).`;
  }
  return `${label}, your parcel ${tracking} (booking ${booking}) has been updated after our call.`;
}

export async function sendPickupQueueNotificationSvc(input: {
  companyId: string;
  parcelId: string;
  queueCode: string;
  queueNumber: number;
  branchName: string;
  locationName: string;
}): Promise<{ sent: boolean }> {
  try {
    const parcel = await getParcelRecipientsRepo(input.companyId, input.parcelId);
    if (!parcel?.primary.phone) return { sent: false };

    const receiverName = parcel.primary.name?.trim() || 'Customer';
    const result = await dispatchSmsEventSvc({
      companyId: input.companyId,
      eventCode: 'pickup_queue_ticket',
      phone: parcel.primary.phone,
      recipientType: 'receiver',
      recipientId: parcel.primary.id,
      recipientName: parcel.primary.name,
      variables: {
        queueCode: input.queueCode,
        queueNumber: input.queueNumber,
        receiverName,
        branchName: input.branchName,
        branch: input.branchName,
        location: input.locationName,
        trackingCode: parcel.trackingCode,
        bookingCode: parcel.bookingCode,
      },
      metadataJson: {
        parcelId: input.parcelId,
        queueCode: input.queueCode,
      },
    });

    return { sent: result.status === 'sent' };
  } catch (error) {
    console.error('Failed to send pickup queue SMS notification:', error);
    return { sent: false };
  }
}

export async function sendParcelStatusNotificationSvc(input: {
  companyId: string;
  actorUserId: string;
  parcelId: string;
  outcome: string;
  sendSms?: boolean;
  sendEmail?: boolean;
  includeSecondReceiver?: boolean;
  isResend?: boolean;
}) {
  const parcel = await getParcelRecipientsRepo(input.companyId, input.parcelId);
  if (!parcel) throw NotFound('Parcel not found');

  const recipients = [
    { ...parcel.primary, role: 'receiver' as const },
    ...(input.includeSecondReceiver && parcel.secondary
      ? [{ ...parcel.secondary, role: 'second_receiver' as const }]
      : []),
  ];

  let sentCount = 0;
  let failedCount = 0;
  const failures: ParcelCallNotificationFailure[] = [];

  if (input.sendSms) {
    const eventCode = getParcelStatusSmsEventCode(input.outcome);
    for (const recipient of recipients) {
      if (!recipient.phone) continue;
      const result = await dispatchSmsEventSvc({
        companyId: input.companyId,
        eventCode,
        phone: recipient.phone,
        recipientType: recipient.role,
        recipientId: recipient.id,
        recipientName: recipient.name ?? null,
        variables: {
          receiverName: recipient.name?.trim() || 'Customer',
          trackingCode: parcel.trackingCode,
          bookingCode: parcel.bookingCode,
          outcome: input.outcome,
          branch: parcel.branch,
          branchPhone: parcel.branchPhone,
          location: parcel.location,
        },
        metadataJson: {
          parcelId: parcel.parcelId,
          trackingCode: parcel.trackingCode,
          outcome: input.outcome,
        },
      });
      if (result.status === 'sent') sentCount += 1;
      else {
        failedCount += 1;
        failures.push(buildParcelNotificationFailure('sms', recipient.role, result.errorMessage));
      }
    }
  }

  if (input.sendEmail) {
    const emailProvider = await getDefaultProviderByChannelRepo(input.companyId, 'email');
    for (const recipient of recipients) {
      if (!recipient.email) continue;
      const body = buildCallCenterMessage({
        outcome: input.outcome,
        trackingCode: parcel.trackingCode,
        bookingCode: parcel.bookingCode,
        recipientName: recipient.name ?? 'Customer',
      });
      const subject = `Parcel Update: ${parcel.trackingCode}`;
      const createdDispatch = await createNotificationDispatchRepo({
        companyId: input.companyId,
        campaignId: null,
        channel: 'email',
        providerId: emailProvider?.id ?? null,
        providerKey: emailProvider?.providerKey ?? null,
        recipientType: recipient.role,
        recipientId: recipient.id,
        recipientName: recipient.name ?? null,
        recipientAddress: recipient.email,
        subject,
        body,
        status: 'pending',
        attemptCount: 0,
        metadataJson: {
          eventCode: 'parcel_status_call',
          parcelId: parcel.parcelId,
          trackingCode: parcel.trackingCode,
          outcome: input.outcome,
        },
      });
      if (!createdDispatch) {
        failedCount += 1;
        failures.push(
          buildParcelNotificationFailure(
            'email',
            recipient.role,
            'Failed to create notification dispatch record',
          ),
        );
        continue;
      }

      const result = await dispatchSingleMessage({
        companyId: input.companyId,
        provider: emailProvider,
        dispatchId: createdDispatch.id,
        channel: 'email',
        recipientAddress: recipient.email,
        subject,
        body,
      });
      if (result.status === 'sent') sentCount += 1;
      else {
        failedCount += 1;
        failures.push(buildParcelNotificationFailure('email', recipient.role, result.errorMessage));
      }
    }
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_dispatch',
    entityId: input.parcelId,
    action: 'CALL_CENTER_NOTIFICATION_SENT',
    message: `Call center notification sent for parcel ${parcel.trackingCode}`,
    metadata: {
      parcelId: input.parcelId,
      trackingCode: parcel.trackingCode,
      sendSms: Boolean(input.sendSms),
      sendEmail: Boolean(input.sendEmail),
      isResend: Boolean(input.isResend),
      sentCount,
      failedCount,
    },
  });

  return {
    parcelId: input.parcelId,
    trackingCode: parcel.trackingCode,
    sentCount,
    failedCount,
    failures,
  };
}
