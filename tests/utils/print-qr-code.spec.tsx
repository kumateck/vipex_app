import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrandedQrCode } from '@/components/ui/branded-qr-code';
import { createPrintableHtmlDocument } from '@/features/printing/services/html-document';

describe('serialized receipt QR artwork', () => {
  test('survives serialization into a standalone document without JavaScript or an app origin', () => {
    const bodyHtml = renderToStaticMarkup(
      <BrandedQrCode
        variant="print"
        value="https://vipexparcel.com/tracking/TEST-123"
        size={300}
        style={{ width: '34mm', height: '34mm' }}
      />,
    );
    const html = createPrintableHtmlDocument({ title: 'Receipt', bodyHtml });
    expect(html).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(html).toContain('width:34mm;height:34mm');
    expect(html).toMatch(/<path d="M[^"]+" fill="#000"/);
    expect(html).not.toContain('<canvas');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
  });
  test('encodes each parcel value separately while retaining the on-screen branded variant', () => {
    const print = (value: string) =>
      renderToStaticMarkup(<BrandedQrCode variant="print" value={value} size={300} />);
    expect(print('parcel-one')).not.toBe(print('parcel-two'));
    const branded = renderToStaticMarkup(<BrandedQrCode value="parcel-one" size={300} />);
    expect(branded).toContain('<canvas');
  });
});
