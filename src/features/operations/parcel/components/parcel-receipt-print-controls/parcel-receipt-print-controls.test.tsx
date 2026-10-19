import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelReceiptPrintControls } from './parcel-receipt-print-controls';

const props = {
  autoPrint: false,
  canPrintForSession: true,
  isLoading: false,
  hasPrintableReceipt: true,
  isStickerPrintEnabled: true,
  showSelectionMenu: false,
  triggerLabel: 'Print Sticker + Invoice',
  stickerCopies: 25,
  onStickerCopiesChange: () => {},
  onPrintBoth: () => {},
  onPrintInvoice: () => {},
  onPrintSticker: () => {},
};

describe('completed-booking sticker controls', () => {
  test('offers sticker-only printing with the chosen copies even when a receipt amount exists', () => {
    const markup = renderToStaticMarkup(<ParcelReceiptPrintControls {...props} stickerOnly />);
    expect(markup).toContain('Print Sticker</button>');
    expect(markup).toContain('Sticker copies');
    expect(markup).toContain('value="25"');
    expect(markup).not.toContain('Print Sticker + Invoice');
    expect(markup).not.toContain('max="');
  });

  test('keeps the company sticker module gate', () => {
    expect(
      renderToStaticMarkup(
        <ParcelReceiptPrintControls {...props} stickerOnly isStickerPrintEnabled={false} />,
      ),
    ).toBe('');
  });

  test('keeps cashier-session and loading gates', () => {
    for (const gates of [{ canPrintForSession: false }, { isLoading: true }]) {
      const markup = renderToStaticMarkup(
        <ParcelReceiptPrintControls {...props} {...gates} stickerOnly />,
      );
      expect(markup).toMatch(/<button[^>]*disabled=""/);
    }
  });

  test('preserves ordinary combined print controls', () => {
    const markup = renderToStaticMarkup(<ParcelReceiptPrintControls {...props} />);
    expect(markup).toContain('Print Sticker + Invoice');
  });
});
