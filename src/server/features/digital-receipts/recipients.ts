import type { ReceiptKind } from '@/shared/digital-receipts/channels';

export type ReceiptParty = {
  customerId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
};
export type ReceiptRecipient = ReceiptParty & { role: 'sender' | 'receiver' };

export type ReceiptParties = { sender: ReceiptParty | null; receiver: ReceiptParty | null };

const key = (party: ReceiptParty) =>
  party.customerId ?? party.phone?.replace(/\D/g, '') ?? party.email?.toLowerCase() ?? party.name;

/**
 * Who receives a digital receipt:
 * - booking / sender payment → the sender (payer at the counter)
 * - receiver payment → the main receiver (payer at pickup)
 * - home delivery → the delivery recipient, plus the sender when the sender paid
 * Duplicates (same customer or phone) are sent once.
 */
export function resolveReceiptRecipients(
  kind: ReceiptKind,
  parties: ReceiptParties,
  options: { senderPaid: boolean },
): ReceiptRecipient[] {
  const list: ReceiptRecipient[] = [];
  const add = (party: ReceiptParty | null, role: ReceiptRecipient['role']) => {
    if (party) list.push({ ...party, role });
  };

  if (kind === 'booking' || kind === 'sender_payment') add(parties.sender, 'sender');
  else if (kind === 'receiver_payment') add(parties.receiver, 'receiver');
  else {
    add(parties.receiver, 'receiver');
    if (options.senderPaid) add(parties.sender, 'sender');
  }

  const seen = new Set<string>();
  return list.filter((recipient) => {
    const id = key(recipient);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
