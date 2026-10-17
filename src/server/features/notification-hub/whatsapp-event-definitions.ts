/**
 * Application WhatsApp events. Meta only delivers business-initiated messages
 * that use a template approved in WhatsApp Manager, so each event maps to a
 * template name + language and an ordered list of variables that fill the
 * template's {{1}}, {{2}}… body placeholders.
 *
 * `suggestedTemplateBody` is the text to submit to Meta for approval; it must
 * keep the same placeholder order as `bodyParams`.
 */
export type WhatsAppEventDefinition = {
  code: string;
  name: string;
  description: string;
  category: 'authentication' | 'utility';
  defaultTemplateName: string;
  defaultLanguage: string;
  bodyParams: string[];
  /** Variable used for the dynamic URL button (or the OTP copy-code button). */
  buttonParam?: string;
  /** Variables never written to the dispatch log in clear text. */
  sensitiveVariables?: string[];
  suggestedTemplateBody: string;
  suggestedButton?: string;
};

const RECEIPT_PARAMS = ['customerName', 'bookingCode', 'amountPaid', 'balance', 'destination'];
const RECEIPT_BUTTON = 'URL button "View receipt" → https://vipexparcels.com/receipt/{{1}}';

export const WHATSAPP_EVENT_DEFINITIONS = [
  {
    code: 'receiver_pickup_otp',
    name: 'Receiver pickup OTP',
    description: 'Delivers the one-time code required to confirm a parcel pickup.',
    category: 'authentication',
    defaultTemplateName: 'vipex_pickup_otp',
    defaultLanguage: 'en',
    bodyParams: ['otp'],
    buttonParam: 'otp',
    sensitiveVariables: ['otp'],
    suggestedTemplateBody:
      '{{1}} is your verification code. For your security, do not share this code.',
    suggestedButton: 'Copy code button (authentication template)',
  },
  {
    code: 'digital_receipt_booking',
    name: 'Booking receipt',
    description: 'Sends the booking receipt (or unpaid acknowledgement) to the payer.',
    category: 'utility',
    defaultTemplateName: 'vipex_receipt_booking',
    defaultLanguage: 'en',
    bodyParams: RECEIPT_PARAMS,
    buttonParam: 'receiptToken',
    suggestedTemplateBody:
      'Hello {{1}}, thank you for sending with VIPEX. Booking {{2}} to {{5}}. Amount paid: {{3}}. Balance to pay: {{4}}. Tap below to view your receipt.',
    suggestedButton: RECEIPT_BUTTON,
  },
  {
    code: 'digital_receipt_payment',
    name: 'Payment receipt',
    description: 'Sends the payment receipt to the customer who paid.',
    category: 'utility',
    defaultTemplateName: 'vipex_receipt_payment',
    defaultLanguage: 'en',
    bodyParams: RECEIPT_PARAMS,
    buttonParam: 'receiptToken',
    suggestedTemplateBody:
      'Hello {{1}}, we have received your payment for booking {{2}} ({{5}}). Amount paid: {{3}}. Balance: {{4}}. Tap below to view your receipt.',
    suggestedButton: RECEIPT_BUTTON,
  },
  {
    code: 'digital_receipt_home_delivery',
    name: 'Home delivery receipt',
    description: 'Sends the home delivery receipt to the delivery recipient and the payer.',
    category: 'utility',
    defaultTemplateName: 'vipex_receipt_home_delivery',
    defaultLanguage: 'en',
    bodyParams: RECEIPT_PARAMS,
    buttonParam: 'receiptToken',
    suggestedTemplateBody:
      'Hello {{1}}, booking {{2}} has been delivered to {{5}}. Amount paid: {{3}}. Balance: {{4}}. Tap below to view your delivery receipt.',
    suggestedButton: RECEIPT_BUTTON,
  },
] as const satisfies readonly WhatsAppEventDefinition[];

export type WhatsAppEventCode = (typeof WHATSAPP_EVENT_DEFINITIONS)[number]['code'];

export function getWhatsAppEventDefinition(code: string): WhatsAppEventDefinition | null {
  return WHATSAPP_EVENT_DEFINITIONS.find((definition) => definition.code === code) ?? null;
}

type Variables = Record<string, string | number | null | undefined>;
const value = (variables: Variables, key: string) => String(variables[key] ?? '').trim();

/** Ordered template parameters for Meta. WhatsApp rejects empty parameters, so blanks become "-". */
export function buildWhatsAppEventParams(
  definition: WhatsAppEventDefinition,
  variables: Variables,
) {
  return {
    bodyParams: definition.bodyParams.map((key) => value(variables, key) || '-'),
    buttonUrlParam: definition.buttonParam
      ? value(variables, definition.buttonParam) || null
      : null,
  };
}

/** Human-readable log line for the dispatch history, with sensitive values hidden. */
export function buildWhatsAppEventPreview(
  definition: WhatsAppEventDefinition,
  templateName: string,
  variables: Variables,
) {
  const hidden = new Set(definition.sensitiveVariables ?? []);
  const parts = definition.bodyParams.map(
    (key, index) =>
      `{{${index + 1}}} ${key}=${hidden.has(key) ? '[hidden]' : value(variables, key) || '-'}`,
  );
  return `[WhatsApp template ${templateName}] ${parts.join('; ')}`;
}
