import { PRINT_LOGO_DATA_URI } from '@/shared/printing/print-logo';
import { ThermalStickerBrand } from './thermal-sticker-brand';

export function ThermalStickerHeaderPanel({ duplicate }: { duplicate?: boolean }) {
  return (
    <section
      style={{
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '2.5mm',
      }}
    >
      <img
        src={PRINT_LOGO_DATA_URI}
        alt="Vipex emblem"
        style={{ width: '20mm', height: '20mm', objectFit: 'contain' }}
      />
      <ThermalStickerBrand size="landscape" duplicate={duplicate} />
    </section>
  );
}
