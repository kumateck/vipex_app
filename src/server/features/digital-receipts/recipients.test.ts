import { describe, expect, test } from 'bun:test';
import { resolveReceiptRecipients } from './recipients';

const sender = {
  customerId: 'c-sender',
  name: 'Ama',
  phone: '0244123456',
  email: 'ama@example.com',
};
const receiver = { customerId: 'c-receiver', name: 'Kofi', phone: '0209876543', email: null };
const parties = { sender, receiver };

describe('resolveReceiptRecipients', () => {
  test('booking and sender payment receipts go to the sender', () => {
    for (const kind of ['booking', 'sender_payment'] as const) {
      expect(resolveReceiptRecipients(kind, parties, { senderPaid: true })).toEqual([
        { ...sender, role: 'sender' },
      ]);
    }
  });

  test('receiver payment receipts go to the main receiver', () => {
    expect(resolveReceiptRecipients('receiver_payment', parties, { senderPaid: true })).toEqual([
      { ...receiver, role: 'receiver' },
    ]);
  });

  test('home delivery goes to the delivery recipient and the paying sender', () => {
    expect(
      resolveReceiptRecipients('home_delivery', parties, { senderPaid: true }).map((r) => r.role),
    ).toEqual(['receiver', 'sender']);
    expect(
      resolveReceiptRecipients('home_delivery', parties, { senderPaid: false }).map((r) => r.role),
    ).toEqual(['receiver']);
  });

  test('sends once when sender and receiver are the same customer', () => {
    const same = { sender, receiver: { ...sender, name: 'Ama (self)' } };
    expect(resolveReceiptRecipients('home_delivery', same, { senderPaid: true })).toHaveLength(1);
  });

  test('skips a missing party', () => {
    expect(
      resolveReceiptRecipients('booking', { sender: null, receiver }, { senderPaid: true }),
    ).toEqual([]);
  });
});
