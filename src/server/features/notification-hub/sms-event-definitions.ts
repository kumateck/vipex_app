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
  'location',
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
      'location',
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
    variables: ['receiverName', 'otp', 'expiresInMinutes', 'branch', 'location'],
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
