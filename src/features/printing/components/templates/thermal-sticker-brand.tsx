import { ThermalStickerWordmark } from './thermal-sticker-wordmark';

type ThermalStickerBrandProps = {
  size?: 'portrait' | 'landscape';
  duplicate?: boolean;
};

/**
 * Wordmark with the reprint mark in the free header space beneath it, so DUPLICATE never
 * adds a line to the status box and pushes the parcel rows off the sticker.
 */
export function ThermalStickerBrand({ size = 'portrait', duplicate }: ThermalStickerBrandProps) {
  return (
    <div data-sticker-brand style={{ minWidth: 0, display: 'grid', justifyItems: 'center' }}>
      <ThermalStickerWordmark size={size} />
      {duplicate ? (
        <div
          style={{
            // Clears the absolutely positioned "EX" beneath the wordmark's P.
            marginTop: size === 'landscape' ? '3mm' : '2.2mm',
            fontSize: size === 'landscape' ? '3.4mm' : '2.8mm',
            fontWeight: 900,
            letterSpacing: '0.08em',
            lineHeight: 1,
          }}
        >
          DUPLICATE
        </div>
      ) : null}
    </div>
  );
}
