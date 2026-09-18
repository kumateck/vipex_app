import logoPng from '@/assets/logo.png';
import { BrandedQrCode } from '@/components/ui/branded-qr-code';
import { PAYMENT_DUE_NOTE } from './thermal-sticker-copy';
import { portraitReceiverNameFontSize } from './thermal-sticker-font-size.utils';
import { DestinationRow } from './thermal-sticker-portrait-sections';
import type { PreparedThermalStickerTemplateProps } from './thermal-sticker-template-types';
import { StickerRow } from './thermal-sticker-template-utils';
import { ThermalStickerWordmark } from './thermal-sticker-wordmark';

export function ThermalStickerPortraitTemplate({
  bookingCode,
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
  const statusRowHeight = hasToBePaid ? '12.5mm' : '10.5mm';
  const receiverNameFontSize = portraitReceiverNameFontSize(receiverName);

  return (
    <div
      className="bg-white text-black"
      style={{
        width: '90mm',
        height: '92mm',
        boxSizing: 'border-box',
        border: '0.35mm solid #111',
        padding: '1.2mm',
        fontFamily: 'Arial, sans-serif',
        display: 'grid',
        gridTemplateRows: `21mm ${statusRowHeight} 18mm minmax(0, 1fr)`,
        gap: '0.5mm',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: '11mm 1fr 19mm',
          alignItems: 'center',
          columnGap: '2mm',
        }}
      >
        <img
          src={logoPng}
          alt="Vipex logo"
          style={{
            width: '11mm',
            height: '11mm',
            objectFit: 'contain',
          }}
        />
        <ThermalStickerWordmark />
        <div
          className="self-start justify-self-end"
          style={{ display: 'grid', justifyItems: 'center', rowGap: '0.25mm' }}
        >
          <BrandedQrCode
            value={qrValue}
            size={160}
            variant="print"
            ariaLabel="Parcel tracking QR code"
            style={{
              width: '18mm',
              height: '18mm',
              backgroundColor: '#ffffff',
            }}
          />
          <div style={{ fontSize: '1.45mm', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap' }}>
            {bookingCode}
          </div>
        </div>
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
            style={{ fontSize: hasToBePaid ? '4.4mm' : '5.4mm', fontWeight: 900, lineHeight: 1 }}
          >
            {statusLabel}
          </div>
          {statusAmountLabel ? (
            <div style={{ marginTop: '0.1mm', fontSize: '3.7mm', fontWeight: 900, lineHeight: 1 }}>
              {statusAmountLabel}
            </div>
          ) : null}
          {hasToBePaid ? (
            <div style={{ marginTop: '0.35mm', fontSize: '1.9mm', fontWeight: 700, lineHeight: 1 }}>
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
            fontSize: '3.9mm',
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
          gridTemplateRows: '10.5mm 6.5mm 6.5mm minmax(11mm, 1fr)',
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
