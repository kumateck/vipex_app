import { PRINT_LOGO_DATA_URI } from '@/shared/printing/print-logo';
import { ThermalStickerWordmark } from './thermal-sticker-wordmark';

export function ThermalStickerHeaderPanel() {
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
      <ThermalStickerWordmark size="landscape" />
    </section>
  );
}
