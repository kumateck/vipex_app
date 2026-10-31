import { ThermalStickerWordmark } from './thermal-sticker-wordmark';
import { ThermalStickerPrintDetails } from './thermal-sticker-print-details';

type ThermalStickerBrandProps = {
  size?: 'portrait' | 'landscape';
  duplicate?: boolean;
  printedByName?: string | null;
  issuedAtLabel?: string | null;
};

/**
 * Contact and issuer details occupy the existing header space beneath the wordmark.
 * DUPLICATE stays in this same block without adding height to the sticker or status box.
 */
export function ThermalStickerBrand({
  size = 'portrait',
  duplicate,
  printedByName,
  issuedAtLabel,
}: ThermalStickerBrandProps) {
  return (
    <div data-sticker-brand style={{ minWidth: 0, display: 'grid', justifyItems: 'center' }}>
      <ThermalStickerWordmark size={size} />
      <div
        style={{ width: '100%', minWidth: 0, marginTop: size === 'landscape' ? '3mm' : '2.2mm' }}
      >
        <ThermalStickerPrintDetails
          printedByName={printedByName}
          issuedAtLabel={issuedAtLabel}
          size={size}
        />
      </div>
      {duplicate ? (
        <div
          style={{
            marginTop: '0.5mm',
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
