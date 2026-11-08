import { describe, expect, test } from 'bun:test';
import { getWhatsAppEventDefinition } from '../notification-hub/whatsapp-event-definitions';
import { buildWhatsAppTestMessage } from './test-message';

const resolve = (code: string, templateName?: string, language?: string) => {
  const definition = getWhatsAppEventDefinition(code);
  if (!definition) throw new Error(`missing definition ${code}`);
  return {
    definition,
    templateName: templateName ?? definition.defaultTemplateName,
    language: language ?? definition.defaultLanguage,
  };
};

describe('buildWhatsAppTestMessage', () => {
  test('fills a receipt template with sample values in placeholder order', () => {
    const message = buildWhatsAppTestMessage(resolve('digital_receipt_booking'));
    expect(message).toEqual({
      templateName: 'vipex_receipt_booking',
      language: 'en',
      bodyParams: ['Test Customer', 'TEST-0001', 'GHS 0.00', 'GHS 0.00', 'Test destination'],
      buttonUrlParam: 'test',
    });
  });

  test('uses the company template override', () => {
    const message = buildWhatsAppTestMessage(
      resolve('digital_receipt_payment', 'custom_payment', 'en_US'),
    );
    expect(message.templateName).toBe('custom_payment');
    expect(message.language).toBe('en_US');
  });

  test('sends a sample code for the OTP template, never an empty param', () => {
    const message = buildWhatsAppTestMessage(resolve('receiver_pickup_otp'));
    expect(message.bodyParams).toEqual(['123456']);
    expect(message.buttonUrlParam).toBe('123456');
  });
});
