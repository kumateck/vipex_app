import { describe, expect, test } from 'bun:test';
import { buildReceiptMessageVariables, SMS_EVENT_BY_KIND } from './message-summary';
import { getSmsEventDefinition } from '../notification-hub/sms-event-definitions';
import { getWhatsAppEventDefinition } from '../notification-hub/whatsapp-event-definitions';
import { renderTemplate } from '../notification-hub/utils';

const variables = buildReceiptMessageVariables({
  recipientName: ' Ama Mensah ',
  bookingCode: 'BK-2026-0001',
  summary: {
    amountPaidCedis: 40,
    balanceCedis: 12.5,
    destinationBranch: 'Kumasi',
    destinationLocation: 'Adum',
  },
  token: 'a'.repeat(64),
  url: `https://vipexparcels.com/receipt/${'a'.repeat(64)}`,
});

describe('digital receipt message', () => {
  test('quotes the booking code and formatted amounts', () => {
    expect(variables).toMatchObject({
      customerName: 'Ama Mensah',
      bookingCode: 'BK-2026-0001',
      amountPaid: 'GH₵ 40.00',
      balance: 'GH₵ 12.50',
      destination: 'Kumasi',
    });
  });

  test('every receipt kind has SMS and WhatsApp events that never mention the tracking code', () => {
    for (const code of Object.values(SMS_EVENT_BY_KIND)) {
      const sms = getSmsEventDefinition(code);
      const whatsapp = getWhatsAppEventDefinition(code);
      expect(sms).not.toBeNull();
      expect(whatsapp).not.toBeNull();
      expect(sms!.variables).not.toContain('trackingCode');
      const body = renderTemplate(sms!.defaultBody, variables);
      expect(body).toContain('BK-2026-0001');
      expect(body).toContain(variables.receiptUrl);
      expect(body).not.toMatch(/{{/);
    }
  });

  test('falls back to a generic greeting for a blank name', () => {
    expect(
      buildReceiptMessageVariables({
        recipientName: '  ',
        bookingCode: 'B',
        summary: {
          amountPaidCedis: 0,
          balanceCedis: 0,
          destinationBranch: '-',
          destinationLocation: '-',
        },
        token: 't',
        url: 'u',
      }).customerName,
    ).toBe('Customer');
  });
});
