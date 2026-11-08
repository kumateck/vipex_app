import type { WhatsAppEventTemplate } from '../types';

/** Meta's sample template; Meta only accepts it from its public test numbers. */
export const HELLO_WORLD_TEST_TEMPLATE = 'hello_world';
export const DEFAULT_TEST_TEMPLATE = 'digital_receipt_booking';

export type WhatsAppTestTemplateOption = { value: string; label: string };

export function buildWhatsAppTestTemplateOptions(
  events: WhatsAppEventTemplate[],
): WhatsAppTestTemplateOption[] {
  return [
    ...events.map((event) => ({
      value: event.code,
      label: `${event.name} (${event.templateName})`,
    })),
    { value: HELLO_WORLD_TEST_TEMPLATE, label: 'Meta hello_world (test numbers only)' },
  ];
}
