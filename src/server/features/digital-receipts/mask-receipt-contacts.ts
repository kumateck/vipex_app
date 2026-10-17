import type { ReceiptDocument } from './render/render-receipt-html';

const KEEP_START = 3;
const KEEP_END = 2;

/** "0244123456" -> "024*****56"; punctuation is kept, only digits are hidden. */
function maskPhone(phone: string): string {
  const digitCount = phone.replace(/\D/g, '').length;
  if (digitCount <= KEEP_START + KEEP_END) return phone;
  let seen = 0;
  return phone.replace(/\d/g, (digit) => {
    seen += 1;
    return seen <= KEEP_START || seen > digitCount - KEEP_END ? digit : '*';
  });
}

/** Masks each number in a comma-separated list such as "0244123456, 0201234567". */
export function maskPhoneList(value: string): string {
  // Mask each number between commas, keeping the surrounding spacing.
  return value.replace(/[^,\s][^,]*[^,\s]|[^,\s]/g, maskPhone);
}

/**
 * The online receipt copy is reachable by anyone holding the link (it may be forwarded), so
 * sender, receiver and payer phone numbers are masked there. Printed receipts are unchanged.
 */
export function maskReceiptDocumentContacts(document: ReceiptDocument): ReceiptDocument {
  if (document.template === 'invoice-a5') {
    const { props } = document;
    return {
      template: 'invoice-a5',
      props: {
        ...props,
        payerTelephone: maskPhoneList(props.payerTelephone),
        senderTelephone: maskPhoneList(props.senderTelephone),
        receiverTelephone: maskPhoneList(props.receiverTelephone),
      },
    };
  }
  const { props } = document;
  return {
    template: 'home-delivery-a5',
    props: {
      ...props,
      senderPhone: maskPhoneList(props.senderPhone),
      receiverPhone: maskPhoneList(props.receiverPhone),
    },
  };
}
