import logoPng from '@/assets/logo.png';
import { ThermalStickerCashierLine } from './thermal-sticker-cashier-line';
import { ThermalStickerWordmark } from './thermal-sticker-wordmark';

export function ThermalStickerHeaderPanel({ cashierName }: { cashierName?: string | null }) {
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
      <div style={{ minWidth: 0 }}>
        <ThermalStickerWordmark size="landscape" />
        <ThermalStickerCashierLine cashierName={cashierName} size="landscape" />
      </div>
    </section>
  );
}
