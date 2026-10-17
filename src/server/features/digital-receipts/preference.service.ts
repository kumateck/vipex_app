import { NotFound } from '@/server/utils/http-error';
import {
  DEFAULT_RECEIPT_DELIVERY_CHANNELS,
  normalizeReceiptChannels,
  type ReceiptKind,
} from '@/shared/digital-receipts/channels';
import { loadReceiptRecipientsSvc } from './delivery.service';
import { getCustomerReceiptChannelsRepo, updateCustomerReceiptChannelsRepo } from './repository';

function savedChannels(value: string[] | null | undefined) {
  const channels = normalizeReceiptChannels(value);
  return channels.length ? channels : DEFAULT_RECEIPT_DELIVERY_CHANNELS;
}

export async function getCustomerReceiptPreferenceSvc(companyId: string, customerId: string) {
  const customer = await getCustomerReceiptChannelsRepo(companyId, customerId);
  if (!customer) throw NotFound('Customer not found');
  return {
    customerId,
    channels: savedChannels(customer.receiptDeliveryChannels),
    hasPhone: Boolean(customer.telephone?.trim()),
    hasEmail: Boolean(customer.email?.trim()),
  };
}

/** Saves the choice made at booking/payment as the customer's next default. */
export async function saveCustomerReceiptPreferenceSvc(input: {
  companyId: string;
  customerId: string;
  channels: string[];
}) {
  const customer = await getCustomerReceiptChannelsRepo(input.companyId, input.customerId);
  if (!customer) throw NotFound('Customer not found');
  const channels = savedChannels(input.channels);
  await updateCustomerReceiptChannelsRepo(input.companyId, input.customerId, channels);
  return { customerId: input.customerId, channels };
}

/** Recipients of a parcel receipt and the payer's saved default channels. */
export async function getParcelReceiptOptionsSvc(input: {
  companyId: string;
  parcelId: string;
  kind: ReceiptKind;
}) {
  const recipients = await loadReceiptRecipientsSvc(input.companyId, input.parcelId, input.kind);
  const payer = recipients[0];
  const preference = payer?.customerId
    ? await getCustomerReceiptChannelsRepo(input.companyId, payer.customerId)
    : null;
  return {
    payerCustomerId: payer?.customerId ?? null,
    defaultChannels: savedChannels(preference?.receiptDeliveryChannels),
    recipients: recipients.map((recipient) => ({
      role: recipient.role,
      name: recipient.name,
      customerId: recipient.customerId,
      hasPhone: Boolean(recipient.phone?.trim()),
      hasEmail: Boolean(recipient.email?.trim()),
    })),
  };
}
