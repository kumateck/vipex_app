import { STICKER_COMPLAINTS_LINE } from '@/shared/printing';

export function ThermalStickerPrintDetails({
  printedByName,
  issuedAtLabel,
  size = 'portrait',
}: {
  printedByName?: string | null;
  issuedAtLabel?: string | null;
  size?: 'portrait' | 'landscape';
}) {
  return (
    <div
      data-sticker-print-details
      style={{
        display: 'grid',
        gap: '0.3mm',
        width: '100%',
        minWidth: 0,
        fontSize: size === 'portrait' ? '1.9mm' : '2.1mm',
        fontWeight: 700,
        lineHeight: 1.15,
        textAlign: 'center',
      }}
    >
      <div style={{ whiteSpace: 'nowrap' }}>{STICKER_COMPLAINTS_LINE}</div>
      <div
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: (printedByName?.trim().length ?? 0) > 28 ? '1.6mm' : undefined,
        }}
      >
        Cashier: {printedByName?.trim() || '-'}
      </div>
      <div style={{ whiteSpace: 'nowrap' }}>Date: {issuedAtLabel?.trim() || '-'}</div>
    </div>
  );
}
