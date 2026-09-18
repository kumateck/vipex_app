import { BrandedQrCode } from '@/components/ui/branded-qr-code';
import { ThermalStickerHeaderPanel } from './thermal-sticker-header-panel';
import { landscapeReceiverNameFontSize } from './thermal-sticker-font-size.utils';
import { InfoBlock, ParcelStack, SenderBlock } from './thermal-sticker-info-sections';
import { PAYMENT_DUE_NOTE } from './thermal-sticker-copy';
import type { PreparedThermalStickerTemplateProps } from './thermal-sticker-template-types';

export function ThermalStickerLandscapeTemplate({
  bookingCode,
  senderName,
  senderTelephones,
  receiverName,
  receiverTelephones,
  destinationBranchName,
  destinationLocationName,
  parcelContent,
  parcelDetails,
  statusLabel,
  statusAmountLabel,
  hasToBePaid,
  qrValue,
}: PreparedThermalStickerTemplateProps) {
  return (
    <div
      className="bg-white text-black"
      style={{
        width: '210mm',
        height: '69mm',
        margin: '3mm 0',
        boxSizing: 'border-box',
        border: '0.35mm solid #111',
        padding: '2.4mm 3mm',
        fontFamily: 'Arial, sans-serif',
        display: 'grid',
        gridTemplateColumns: '62mm 1fr 47mm',
        gap: '2.5mm',
      }}
    >
      <ThermalStickerHeaderPanel />

      <main
        style={{
          minWidth: 0,
          display: 'grid',
          gridTemplateRows: '18mm 1fr',
          borderLeft: '0.25mm solid #111',
          borderRight: '0.25mm solid #111',
        }}
      >
        <ReceiverHeader receiverName={receiverName} receiverTelephones={receiverTelephones} />

        <div
          style={{
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: '32mm minmax(0, 1.15fr) minmax(0, 1fr)',
            borderTop: '0.25mm solid #111',
          }}
        >
          <InfoBlock
            label="Destination"
            primary={destinationBranchName}
            secondary={destinationLocationName}
          />
          <SenderBlock senderName={senderName} senderTelephones={senderTelephones} />
          <ParcelStack parcelContent={parcelContent} parcelDetails={parcelDetails} />
        </div>
      </main>

      <aside
        style={{
          display: 'grid',
          gridTemplateRows: hasToBePaid ? '19mm 1fr' : '11mm 1fr',
          alignItems: 'start',
          justifyItems: 'center',
          minWidth: 0,
          gap: '2mm',
        }}
      >
        <div
          style={{
            alignSelf: 'stretch',
            border: '0.3mm solid #111',
            fontWeight: 800,
            fontSize: hasToBePaid ? '3.8mm' : '5.2mm',
            lineHeight: 1,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            padding: '0 1mm',
          }}
        >
          <div>
            <div>{statusLabel}</div>
            {statusAmountLabel ? (
              <div style={{ marginTop: '0.8mm', fontSize: '4.7mm' }}>{statusAmountLabel}</div>
            ) : null}
            {hasToBePaid ? (
              <div style={{ marginTop: '0.6mm', fontSize: '1.7mm', fontWeight: 700 }}>
                {PAYMENT_DUE_NOTE}
              </div>
            ) : null}
          </div>
        </div>
        <div
          style={{
            alignSelf: 'center',
            display: 'grid',
            placeItems: 'center',
            minWidth: 0,
            width: '100%',
          }}
        >
          <div style={{ display: 'grid', justifyItems: 'center', rowGap: '0.4mm' }}>
            <BrandedQrCode
              value={qrValue}
              size={220}
              variant="print"
              ariaLabel="Parcel tracking QR code"
              className="justify-self-end"
              style={{ width: '28mm', height: '28mm', backgroundColor: '#ffffff' }}
            />
            <div
              style={{ fontSize: '1.8mm', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap' }}
            >
              {bookingCode}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ReceiverHeader({
  receiverName,
  receiverTelephones,
}: {
  receiverName: string;
  receiverTelephones: string;
}) {
  const receiverNameFontSize = landscapeReceiverNameFontSize(receiverName);

  return (
    <header
      style={{
        minWidth: 0,
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        padding: '0.6mm 2mm',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: '3mm', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>
        Receiver
      </div>
      <div
        style={{
          minHeight: 0,
          minWidth: 0,
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          fontSize: receiverNameFontSize,
          fontWeight: 800,
          lineHeight: 0.95,
          overflowWrap: 'anywhere',
        }}
      >
        {receiverName}
      </div>
      <div
        style={{
          minWidth: 0,
          marginTop: '0.5mm',
          fontSize: '4.6mm',
          fontWeight: 900,
          lineHeight: 1,
          overflowWrap: 'anywhere',
        }}
      >
        {receiverTelephones}
      </div>
    </header>
  );
}
