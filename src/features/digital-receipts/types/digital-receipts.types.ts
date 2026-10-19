import type {
  DigitalReceiptChannel,
  ReceiptDeliveryChannel,
  ReceiptKind,
} from '@/shared/digital-receipts/channels';

export type { DigitalReceiptChannel, ReceiptDeliveryChannel, ReceiptKind };

export type CustomerReceiptPreference = {
  customerId: string;
  channels: ReceiptDeliveryChannel[];
  hasPhone: boolean;
  hasEmail: boolean;
};

export type ParcelReceiptOptions = {
  payerCustomerId: string | null;
  defaultChannels: ReceiptDeliveryChannel[];
  recipients: Array<{
    role: 'sender' | 'receiver';
    name: string;
    customerId: string | null;
    hasPhone: boolean;
    hasEmail: boolean;
  }>;
};

export type ReceiptSendResult = {
  role: 'sender' | 'receiver';
  name: string;
  channel: DigitalReceiptChannel;
  status: 'sent' | 'failed' | 'skipped';
  detail: string | null;
};

export type SendDigitalReceiptResponse = {
  shareLinkId: string;
  url: string;
  expiresAt: string;
  results: ReceiptSendResult[];
};

/** Which digital channels the picker may offer for a customer. */
export type ReceiptChannelAvailability = {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
  showWhatsApp: boolean;
};
