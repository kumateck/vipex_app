import { describe, expect, test } from 'bun:test';
import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { useForm, FormProvider } from 'react-hook-form';
import { store } from '@/store';
import { ParcelChargeExemption } from '@/features/operations/parcel-charge-exemption';
import { createInitialFormValues } from '@/features/operations/parcel/components/parcel-create/parcel-create-form.utils';
import { ParcelReceiptPrintContent } from '@/features/operations/parcel/components/parcel-receipt-print-content';

function BookingFields({ customerType }: { customerType: number }) {
  const values = createInitialFormValues();
  values.parcels[0]!.receiver.customerType = customerType;
  const form = useForm({ defaultValues: values });
  return (
    <Provider store={store}>
      <FormProvider {...form}>
        <ParcelChargeExemption index={0} />
      </FormProvider>
    </Provider>
  );
}

describe('exempt booking and print UI', () => {
  test.each([2, 3, 4, 5])(
    'customer type %i displays the exemption and requires staff only for Staff',
    (customerType) => {
      const html = renderToStaticMarkup(<BookingFields customerType={customerType} />);
      expect(html).toContain('Exempt');
      expect(html).toContain('including storage and delivery fees');
      if (customerType === 5) {
        expect(html).toContain('Receiving staff (required)');
        expect(html).toContain('office number');
      } else expect(html).not.toContain('Receiving staff');
    },
  );

  test('ordinary customer has no exemption notice', () => {
    expect(renderToStaticMarkup(<BookingFields customerType={0} />)).toBe('');
  });

  test('verified Staff sticker and invoice preserve staff identity and office phone', () => {
    const html = renderToStaticMarkup(
      <ParcelReceiptPrintContent
        data={{
          bookingCode: 'BK',
          trackingCode: 'TRK',
          parcelDetails: 'One box',
          senderName: 'Sender',
          senderTelephone: '0240000000',
          receiverName: 'Kumasi office',
          receiverTelephone: '0240000005',
          destinationBranchName: 'Kumasi',
          destinationLocationName: 'Office',
          totalChargeCedis: 0,
          senderPaidCedis: 0,
          receiverToPayCedis: 0,
          issuedAt: '2026-11-01T10:00:00Z',
        }}
        verifiedStickerPayment={{
          bookingCode: 'BK',
          trackingCode: 'TRK',
          status: 'EXEMPT',
          amountCedis: 0,
          relatedStaffNameSnapshot: 'Ama Mensah',
        }}
        desktopStickerRef={createRef()}
        stickerRef={createRef()}
        invoiceRef={createRef()}
        qrUrl="https://vipexparcel.com/tracking/TRK"
        amountPaidCedis={0}
        tax={{ vat: 0, getfund: 0, nhil: 0, covid: 0, totalTax: 0 }}
      />,
    );
    expect(html).toContain('EXEMPT');
    expect(html).toContain('Kumasi office — Ama Mensah');
    expect(html).toContain('0240000005');
    expect(html.includes('Exempt')).toBe(true);
    expect(html.includes('daily storage fee')).toBe(false);
    expect(html).not.toContain('>PAID<');
    expect(html).not.toContain('PLEASE NOTE: PAYMENT DUE');
  });
});
