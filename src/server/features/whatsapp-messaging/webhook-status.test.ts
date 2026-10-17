import { describe, expect, test } from 'bun:test';
import { extractWhatsAppStatusUpdates, nextDispatchStatus } from './webhook-status';

const payload = (statuses: unknown[]) => ({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA',
      changes: [
        {
          field: 'messages',
          value: { metadata: { phone_number_id: 'PNID' }, statuses },
        },
      ],
    },
  ],
});

describe('extractWhatsAppStatusUpdates', () => {
  test('reads delivered/read/failed statuses with the phone number id', () => {
    const updates = extractWhatsAppStatusUpdates(
      payload([
        { id: 'wamid.1', status: 'delivered' },
        { id: 'wamid.2', status: 'read' },
        {
          id: 'wamid.3',
          status: 'failed',
          errors: [{ code: 131026, title: 'Message undeliverable' }],
        },
      ]),
    );
    expect(updates).toEqual([
      {
        phoneNumberId: 'PNID',
        providerMessageId: 'wamid.1',
        status: 'delivered',
        errorMessage: null,
      },
      { phoneNumberId: 'PNID', providerMessageId: 'wamid.2', status: 'read', errorMessage: null },
      {
        phoneNumberId: 'PNID',
        providerMessageId: 'wamid.3',
        status: 'failed',
        errorMessage: 'WhatsApp delivery failed (code 131026): Message undeliverable',
      },
    ]);
  });

  test('ignores inbound messages, unknown statuses and malformed payloads', () => {
    expect(extractWhatsAppStatusUpdates(null)).toEqual([]);
    expect(extractWhatsAppStatusUpdates({ entry: 'x' })).toEqual([]);
    expect(
      extractWhatsAppStatusUpdates(
        payload([{ id: 'wamid.1', status: 'deleted' }, { status: 'read' }]),
      ),
    ).toEqual([]);
  });
});

describe('nextDispatchStatus', () => {
  test('moves forward through sent → delivered → read', () => {
    expect(nextDispatchStatus('sent', 'delivered')).toBe('delivered');
    expect(nextDispatchStatus('delivered', 'read')).toBe('read');
    expect(nextDispatchStatus('sent', 'read')).toBe('read');
  });

  test('never moves backwards or repeats', () => {
    expect(nextDispatchStatus('read', 'delivered')).toBeNull();
    expect(nextDispatchStatus('delivered', 'delivered')).toBeNull();
    expect(nextDispatchStatus('delivered', 'sent')).toBeNull();
  });

  test('records failures unless the message was already read', () => {
    expect(nextDispatchStatus('sent', 'failed')).toBe('failed');
    expect(nextDispatchStatus('delivered', 'failed')).toBe('failed');
    expect(nextDispatchStatus('read', 'failed')).toBeNull();
    expect(nextDispatchStatus('failed', 'delivered')).toBeNull();
  });
});
