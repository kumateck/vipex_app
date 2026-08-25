import logoPng from '@/assets/logo.png';
import { BrandedQrCode } from '@/components/ui/branded-qr-code';
import { PAYMENT_DUE_NOTE } from './thermal-sticker-copy';
import { portraitReceiverNameFontSize } from './thermal-sticker-font-size.utils';
import { DestinationRow } from './thermal-sticker-portrait-sections';
import type { PreparedThermalStickerTemplateProps } from './thermal-sticker-template-types';
import { StickerRow } from './thermal-sticker-template-utils';
import { ThermalStickerWordmark } from './thermal-sticker-wordmark';

export function ThermalStickerPortraitTemplate({
  senderName,
  senderTelephones,
  receiverName,
  receiverTelephones,
  destinationBranchName,
  destinationLocationName,
  parcelDetails,
  statusLabel,
  statusAmountLabel,
  hasToBePaid,
  qrValue,
}: PreparedThermalStickerTemplateProps) {
  const statusRowHeight = hasToBePaid ? '14mm' : '11mm';
  const receiverNameFontSize = portraitReceiverNameFontSize(receiverName);

  return (
    <div
      className="bg-white text-black"
      style={{
        width: '90mm',
        height: '91mm',
        boxSizing: 'border-box',
        border: '0.35mm solid #111',
        padding: '1.2mm',
        fontFamily: 'Arial, sans-serif',
        display: 'grid',
        gridTemplateRows: `16mm ${statusRowHeight} 20mm 1fr`,
        gap: '0.6mm',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: '12mm 1fr 16mm',
          alignItems: 'center',
          columnGap: '2mm',
        }}
      >
        <img
          src={logoPng}
          alt="Vipex logo"
          style={{
            width: '12mm',
            height: '12mm',
            objectFit: 'contain',
          }}
        />
        <ThermalStickerWordmark />
        <BrandedQrCode
          value={qrValue}
          size={160}
          ariaLabel="Parcel tracking QR code"
          style={{
            width: '16mm',
            height: '16mm',
          }}
          className="self-start justify-self-end overflow-hidden"
        />
      </header>

      <section
        style={{
          border: '0.35mm solid #111',
          display: 'grid',
          placeItems: hasToBePaid ? 'start center' : 'center',
          textAlign: 'center',
          padding: hasToBePaid ? '0.45mm 0.25mm 0.9mm' : '0.25mm',
          overflow: 'hidden',
        }}
      >
        <div>
          <div
            style={{ fontSize: hasToBePaid ? '4.8mm' : '5.7mm', fontWeight: 900, lineHeight: 1 }}
          >
            {statusLabel}
          </div>
          {statusAmountLabel ? (
            <div style={{ marginTop: '0.15mm', fontSize: '4mm', fontWeight: 900, lineHeight: 1 }}>
              {statusAmountLabel}
            </div>
          ) : null}
          {hasToBePaid ? (
            <div
              style={{ marginTop: '0.5mm', fontSize: '2.1mm', fontWeight: 700, lineHeight: 1.05 }}
            >
              {PAYMENT_DUE_NOTE}
            </div>
          ) : null}
        </div>
      </section>

      <section
        style={{
          border: '0.35mm solid #111',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
          minWidth: 0,
          overflow: 'hidden',
          textAlign: 'center',
          padding: '0.3mm 1mm',
        }}
      >
        <div
          style={{
            fontSize: '1.8mm',
            fontWeight: 700,
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Receiver
        </div>
        <div
          style={{
            minWidth: 0,
            minHeight: 0,
            marginTop: '0.25mm',
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
            fontSize: receiverNameFontSize,
            fontWeight: 900,
            lineHeight: 0.95,
            overflowWrap: 'anywhere',
          }}
        >
          {receiverName}
        </div>
        <div
          style={{
            marginTop: '0.3mm',
            fontSize: '4.2mm',
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          {receiverTelephones}
        </div>
      </section>

      <main
        style={{
          minHeight: 0,
          display: 'grid',
          gridTemplateRows: '12mm 8mm 8mm 1fr',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        <DestinationRow branch={destinationBranchName} location={destinationLocationName} />
        <StickerRow label="Sender" value={senderName} align="center" emphasis />
        <StickerRow label="Sender Tel" value={senderTelephones} align="center" emphasis />
        <StickerRow label="Parcel Details" value={parcelDetails} align="center" emphasis />
      </main>
    </div>
  );
}
