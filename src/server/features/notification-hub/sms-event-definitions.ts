export type SmsEventDefinition = {
  code: string;
  name: string;
  description: string;
  dispatchAction: string;
  recipient: string;
  defaultBody: string;
  variables: string[];
  smsType?: 'otp';
};

const PARCEL_STATUS_VARIABLES = [
  'receiverName',
  'trackingCode',
  'bookingCode',
  'outcome',
  'branch',
  'branchPhone',
  ...SMS_LOCATION_VARIABLES,
];

const DIGITAL_RECEIPT_VARIABLES = [
  'customerName',
  'bookingCode',
  'amountPaid',
  'balance',
  'destination',
  'receiptUrl',
  'branch',
  ...SMS_LOCATION_VARIABLES,
];

export const SMS_EVENT_DEFINITIONS = [
  {
    code: 'pickup_queue_ticket',
    name: 'Pickup queue ticket',
    description: 'Shares the assigned queue number and pickup location.',
    dispatchAction: 'Dispatched when a pickup queue ticket is created with SMS enabled.',
    recipient: 'Primary parcel receiver',
    defaultBody:
      '{{receiverName}}, your queue number is {{queueNumber}} (ticket {{queueCode}}) at {{branchName}} for parcel {{trackingCode}}. Please wait to be called.',
    variables: [
      'receiverName',
      'queueNumber',
      'queueCode',
      'branchName',
      'branch',
      ...SMS_LOCATION_VARIABLES,
      'trackingCode',
      'bookingCode',
    ],
  },
  {
    code: 'receiver_pickup_otp',
    name: 'Receiver pickup OTP',
    description: 'Delivers the one-time code required to confirm a parcel pickup.',
    dispatchAction: 'Dispatched when a cashier requests or resends a receiver pickup OTP.',
    recipient: 'Selected primary or second receiver',
    defaultBody:
      '{{receiverName}}, your parcel pickup verification code is {{otp}}. It expires in {{expiresInMinutes}} minutes. Do not share this code.',
    variables: ['receiverName', 'otp', 'expiresInMinutes', 'branch', ...SMS_LOCATION_VARIABLES],
    smsType: 'otp',
  },
  {
    code: 'parcel_status_call_pickup',
    name: 'Call outcome: customer pickup',
    description: 'Confirms that the parcel is ready for the customer to collect.',
    dispatchAction: 'Dispatched after the “Customer will come” call outcome with SMS enabled.',
    recipient: 'Primary receiver and optionally second receiver',
    defaultBody:
      '{{receiverName}}, your parcel {{trackingCode}} (booking {{bookingCode}}) is ready for pickup.',
    variables: PARCEL_STATUS_VARIABLES,
  },
  {
    code: 'parcel_status_call_delivery',
    name: 'Call outcome: delivery requested',
    description: 'Confirms that the parcel has been marked for delivery dispatch.',
    dispatchAction: 'Dispatched after the “Customer wants delivery” outcome with SMS enabled.',
    recipient: 'Primary receiver and optionally second receiver',
    defaultBody:
      '{{receiverName}}, your parcel {{trackingCode}} (booking {{bookingCode}}) has been marked for delivery dispatch.',
    variables: PARCEL_STATUS_VARIABLES,
  },
  {
    code: 'parcel_status_call_follow_up',
    name: 'Call outcome: follow-up',
    description: 'Acknowledges that the customer will be contacted again.',
    dispatchAction: 'Dispatched after the “Customer will get back” outcome with SMS enabled.',
    recipient: 'Primary receiver and optionally second receiver',
    defaultBody:
      '{{receiverName}}, thank you. We will follow up on parcel {{trackingCode}} (booking {{bookingCode}}).',
    variables: PARCEL_STATUS_VARIABLES,
  },
  {
    code: 'parcel_status_call_contacted',
    name: 'Call outcome: contacted',
    description: 'Confirms a general parcel update after a completed customer call.',
    dispatchAction: 'Dispatched after the “Contacted” call outcome with SMS enabled.',
    recipient: 'Primary receiver and optionally second receiver',
    defaultBody:
      '{{receiverName}}, your parcel {{trackingCode}} (booking {{bookingCode}}) has been updated after our call.',
    variables: PARCEL_STATUS_VARIABLES,
  },
  {
    code: 'digital_receipt_booking',
    name: 'Digital receipt: booking',
    description:
      'Sends the booking receipt (or unpaid acknowledgement) with a link to the online copy.',
    dispatchAction:
      'Dispatched after a booking when the customer chose SMS for receipt delivery (Digital Receipts module).',
    recipient: 'Sender (booking customer)',
    defaultBody:
      'Hello {{customerName}}, thank you for sending with VIPEX. Booking {{bookingCode}} to {{destination}}. Paid: {{amountPaid}}. Balance: {{balance}}. Receipt: {{receiptUrl}}',
    variables: DIGITAL_RECEIPT_VARIABLES,
  },
  {
    code: 'digital_receipt_payment',
    name: 'Digital receipt: payment',
    description: 'Sends the payment receipt with a link to the online copy.',
    dispatchAction:
      'Dispatched after a sender or receiver payment when the payer chose SMS for receipt delivery.',
    recipient: 'Customer who paid',
    defaultBody:
      'Hello {{customerName}}, payment received for VIPEX booking {{bookingCode}} ({{destination}}). Paid: {{amountPaid}}. Balance: {{balance}}. Receipt: {{receiptUrl}}',
    variables: DIGITAL_RECEIPT_VARIABLES,
  },
  {
    code: 'digital_receipt_home_delivery',
    name: 'Digital receipt: home delivery',
    description: 'Sends the home delivery receipt with a link to the online copy.',
    dispatchAction:
      'Dispatched after a home delivery receipt is issued when SMS was chosen for receipt delivery.',
    recipient: 'Delivery recipient and payer',
    defaultBody:
      'Hello {{customerName}}, VIPEX booking {{bookingCode}} delivered to {{destination}}. Paid: {{amountPaid}}. Balance: {{balance}}. Receipt: {{receiptUrl}}',
    variables: DIGITAL_RECEIPT_VARIABLES,
  },
] as const satisfies readonly SmsEventDefinition[];

export type SmsEventCode = (typeof SMS_EVENT_DEFINITIONS)[number]['code'];

export function getSmsEventDefinition(code: string): SmsEventDefinition | null {
  return SMS_EVENT_DEFINITIONS.find((definition) => definition.code === code) ?? null;
}

export function getParcelStatusSmsEventCode(outcome: string): SmsEventCode {
  const normalized = outcome.trim().toLowerCase();
  if (normalized === 'pickup') return 'parcel_status_call_pickup';
  if (normalized === 'delivery') return 'parcel_status_call_delivery';
  if (normalized === 'follow_up') return 'parcel_status_call_follow_up';
  return 'parcel_status_call_contacted';
}
import { SMS_LOCATION_VARIABLES } from '@/shared/notification-hub';
