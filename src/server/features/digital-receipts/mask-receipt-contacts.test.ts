import { describe, expect, test } from 'bun:test';
import type { HomeDeliveryReceiptA5Props } from '@/features/printing/components/templates/home-delivery-receipt-a5-template';
import type { InvoiceA5TemplateProps } from '@/features/printing/components/templates/invoice-a5-template.types';
import { maskPhoneList, maskReceiptDocumentContacts } from './mask-receipt-contacts';

describe('online receipt contact masking', () => {
  test('keeps the first three and last two digits of each number', () => {
    expect(maskPhoneList('0244123456')).toBe('024*****56');
    expect(maskPhoneList('0244123456, 0201234567')).toBe('024*****56, 020*****67');
    expect(maskPhoneList('+233 24 412 3456')).toBe('+233 ** *** **56');
    expect(maskPhoneList('-')).toBe('-');
    expect(maskPhoneList('')).toBe('');
  });

  test('masks payer, sender and receiver phones on the invoice receipt', () => {
    const props = {
      payerTelephone: '0244123456',
      senderTelephone: '0244123456, 0201234567',
      receiverTelephone: '0551112222',
      senderName: 'Ama Owusu',
    } as unknown as InvoiceA5TemplateProps;

    const masked = maskReceiptDocumentContacts({ template: 'invoice-a5', props });

    expect(masked.template).toBe('invoice-a5');
    expect(masked.props).toMatchObject({
      payerTelephone: '024*****56',
      senderTelephone: '024*****56, 020*****67',
      receiverTelephone: '055*****22',
      senderName: 'Ama Owusu',
    });
    // The printed copy's data is not changed.
    expect(props.receiverTelephone).toBe('0551112222');
  });

  test('masks sender and receiver phones on the home delivery receipt', () => {
    const props = {
      senderPhone: '0244123456',
      receiverPhone: '0551112222, 0207654321',
    } as unknown as HomeDeliveryReceiptA5Props;

    const masked = maskReceiptDocumentContacts({ template: 'home-delivery-a5', props });

    expect(masked.props).toMatchObject({
      senderPhone: '024*****56',
      receiverPhone: '055*****22, 020*****21',
    });
  });
});
