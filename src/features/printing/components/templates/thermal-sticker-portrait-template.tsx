import { PRINT_LOGO_DATA_URI } from '@/shared/printing/print-logo';
import { BrandedQrCode } from '@/components/ui/branded-qr-code';
import { PAYMENT_DUE_NOTE } from './thermal-sticker-copy';
import { ThermalStickerCallSenderMark } from './thermal-sticker-call-sender-mark';
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
  callSender,
  destinationBranchName,
  destinationLocationName,
  parcelDetails,
  statusLabel,
  duplicate,
  statusAmountLabel,
  hasToBePaid,
  qrValue,
}: PreparedThermalStickerTemplateProps) {
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
        // Status and receiver blocks size to their content so text is never clipped;
        // the remaining height goes to the destination/sender/parcel rows.
        gridTemplateRows: '22mm auto auto minmax(0, 1fr)',
        gap: '0.7mm',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: '11mm 1fr 22mm',
          alignItems: 'center',
          columnGap: '2mm',
        }}
      >
        <img
          src={PRINT_LOGO_DATA_URI}
          alt="Vipex logo"
          style={{
            width: '11mm',
            height: '11mm',
            objectFit: 'contain',
          }}
        />
        <ThermalStickerWordmark />
        <div className="justify-self-end">
          <BrandedQrCode
            value={qrValue}
            size={180}
            variant="print"
            ariaLabel="Parcel tracking QR code"
            style={{
              width: '21mm',
              height: '21mm',
              backgroundColor: '#ffffff',
            }}
          />
        </div>
      </header>

      <section
        style={{
          border: '0.35mm solid #111',
          display: 'grid',
          placeItems: 'center',
          minHeight: hasToBePaid ? undefined : '10mm',
          textAlign: 'center',
          padding: '0.7mm 0.5mm',
        }}
      >
        <div>
          <div
            style={{ fontSize: hasToBePaid ? '4.2mm' : '5.4mm', fontWeight: 900, lineHeight: 1.1 }}
          >
            {duplicate ? (
              <div style={{ fontSize: '2.8mm', marginBottom: '0.4mm' }}>DUPLICATE</div>
            ) : null}
            {statusLabel}
          </div>
          {statusAmountLabel ? (
            <div style={{ marginTop: '0.3mm', fontSize: '4mm', fontWeight: 900, lineHeight: 1.1 }}>
              {statusAmountLabel}
            </div>
          ) : null}
          {hasToBePaid ? (
            <div
              style={{ marginTop: '0.6mm', fontSize: '1.9mm', fontWeight: 700, lineHeight: 1.2 }}
            >
              {PAYMENT_DUE_NOTE}
            </div>
          ) : null}
        </div>
      </section>

      <section
        style={{
          position: 'relative',
          border: '0.35mm solid #111',
          display: 'grid',
          gridTemplateRows: 'auto auto auto',
          rowGap: '0.5mm',
          minWidth: 0,
          textAlign: 'center',
          padding: '0.8mm 1mm',
        }}
      >
        {callSender ? <ThermalStickerCallSenderMark /> : null}
        <div
          style={{
            fontSize: '1.8mm',
            fontWeight: 700,
            textTransform: 'uppercase',
            lineHeight: 1.15,
          }}
        >
          Receiver
        </div>
        <div
          style={{
            minWidth: 0,
            padding: '0 4.5mm',
            fontSize: receiverNameFontSize,
            fontWeight: 900,
            lineHeight: 1.1,
            overflowWrap: 'anywhere',
          }}
        >
          {receiverName}
        </div>
        <div
          style={{
            fontSize: '3.9mm',
            fontWeight: 900,
            lineHeight: 1.15,
          }}
        >
          {receiverTelephones}
        </div>
      </section>

      <main
        style={{
          minHeight: 0,
          display: 'grid',
          gridTemplateRows: 'auto auto auto minmax(0, 1fr)',
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
