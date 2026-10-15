import type { WebContents } from 'electron';
import { rollWidthForLayout } from '../../../../src/shared/printing/receipt-paper';

export function receiptHeightMicrons(heightPixels: number) {
  if (!Number.isFinite(heightPixels) || heightPixels <= 0)
    throw new Error('Receipt height is invalid');
  const height = Math.max(30000, Math.ceil((heightPixels * 25400) / 96) + 4000);
  if (height > 2000000) throw new Error('Receipt exceeds the supported roll length');
  return height;
}

export async function prepareReceiptPaper(
  contents: Pick<WebContents, 'executeJavaScript' | 'insertCSS'>,
  layout: string,
) {
  const width = rollWidthForLayout(layout);
  if (!width) return undefined;
  const measured: unknown = await contents.executeJavaScript(`
    document.querySelector('.thermal-receipt-root')?.getBoundingClientRect().height
  `);
  if (typeof measured !== 'number') throw new Error('Vertical receipt content is missing');
  const height = receiptHeightMicrons(measured);
  await contents.insertCSS(
    `@media print { @page { size: ${width}mm ${height / 1000}mm; margin: 0; } }`,
  );
  return height;
}
