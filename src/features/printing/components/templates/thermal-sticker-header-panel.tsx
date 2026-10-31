import { PRINT_LOGO_DATA_URI } from '@/shared/printing/print-logo';
import { ThermalStickerBrand } from './thermal-sticker-brand';

export function ThermalStickerHeaderPanel({
  duplicate,
  printedByName,
  issuedAtLabel,
}: {
  duplicate?: boolean;
  printedByName?: string | null;
  issuedAtLabel?: string | null;
}) {
  return (
    <section
      style={{
        minWidth: 0,
        display: 'grid',
        alignContent: 'center',
        justifyItems: 'center',
        gap: '1.5mm',
      }}
    >
      <img
        src={PRINT_LOGO_DATA_URI}
        alt="Vipex emblem"
        style={{ width: '20mm', height: '20mm', objectFit: 'contain' }}
      />
      <ThermalStickerBrand
        size="portrait"
        duplicate={duplicate}
        printedByName={printedByName}
        issuedAtLabel={issuedAtLabel}
      />
    </section>
  );
}
