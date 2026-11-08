import type { WhatsAppTemplateMessage } from '../notification-hub/providers';
import {
  buildWhatsAppEventParams,
  type WhatsAppEventDefinition,
} from '../notification-hub/whatsapp-event-definitions';

/** Meta's sample template. Meta only accepts it from its public test numbers. */
export const HELLO_WORLD_TEST_TARGET = 'hello_world';
/** Default test: a utility template, so no real OTP-looking code is sent. */
export const DEFAULT_TEST_TARGET = 'digital_receipt_booking';

/** Placeholder values that make a test message obvious to whoever receives it. */
export const WHATSAPP_TEST_SAMPLE_VARIABLES: Record<string, string> = {
  customerName: 'Test Customer',
  bookingCode: 'TEST-0001',
  amountPaid: 'GHS 0.00',
  balance: 'GHS 0.00',
  destination: 'Test destination',
  receiptToken: 'test',
  otp: '123456',
};

export const HELLO_WORLD_TEST_MESSAGE: WhatsAppTemplateMessage = {
  templateName: 'hello_world',
  language: 'en_US',
  bodyParams: [],
};

/** Builds the test message for an application event using its resolved template. */
export function buildWhatsAppTestMessage(resolved: {
  definition: WhatsAppEventDefinition;
  templateName: string;
  language: string;
}): WhatsAppTemplateMessage {
  return {
    templateName: resolved.templateName,
    language: resolved.language,
    ...buildWhatsAppEventParams(resolved.definition, WHATSAPP_TEST_SAMPLE_VARIABLES),
  };
}
