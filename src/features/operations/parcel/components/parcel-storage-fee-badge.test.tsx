import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelStorageFeeBadge } from './parcel-storage-fee-badge';

test('shows the accrued storage fee on searchable parcel records', () => {
  expect(renderToStaticMarkup(<ParcelStorageFeeBadge storageChargePsw={600} />)).toContain(
    'Storage fee · GHS 6.00',
  );
  expect(renderToStaticMarkup(<ParcelStorageFeeBadge storageChargePsw={0} />)).toBe('');
  expect(renderToStaticMarkup(<ParcelStorageFeeBadge />)).toBe('');
});
