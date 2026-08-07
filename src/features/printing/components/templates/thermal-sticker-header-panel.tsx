import logoPng from '@/assets/logo.png';
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
        src={logoPng}
        alt="Vipex emblem"
        style={{ width: '20mm', height: '20mm', objectFit: 'contain' }}
      />
      <ThermalStickerWordmark size="landscape" />
    </section>
  );
}
