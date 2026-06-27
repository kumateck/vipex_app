import logoPng from '@/assets/logo.png';
import type { PreparedThermalStickerTemplateProps } from './thermal-sticker-template-types';
import { StickerRow } from './thermal-sticker-template-utils';

export function ThermalStickerPortraitTemplate({
  bookingCode,
  issuedAtLabel,
  printedByName,
  printedByBranchName,
  printedByLocationName,
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
  qrSvg,
}: PreparedThermalStickerTemplateProps) {
  const printedLocation = [printedByBranchName, printedByLocationName]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(' / ');

  return (
    <div
      className="bg-white text-black"
      style={{
        width: '100mm',
        height: '150mm',
        boxSizing: 'border-box',
        border: '0.35mm solid #111',
        padding: '3mm',
        fontFamily: 'Arial, sans-serif',
        display: 'grid',
        gridTemplateRows: '18mm 18mm 30mm 1fr 13mm',
        gap: '2mm',
      }}
    >
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: '17mm 1fr 26mm',
          alignItems: 'center',
          gap: '2mm',
        }}
      >
        <img
          src={logoPng}
          alt="Vipex logo"
          style={{ width: '16mm', height: '16mm', objectFit: 'contain' }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '6.2mm', fontWeight: 900, lineHeight: 0.9 }}>VIPEX</div>
          <div style={{ fontSize: '2.8mm', fontWeight: 800, lineHeight: 1 }}>
            4x6 Shipping Label
          </div>
          <div style={{ fontSize: '2.2mm', fontWeight: 700, lineHeight: 1.2 }}>
            Printed: {issuedAtLabel}
          </div>
        </div>
        <div
          aria-label="Parcel tracking QR code"
          style={{ width: '25mm', height: '25mm', justifySelf: 'end' }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </header>

      <section
        style={{
          border: '0.35mm solid #111',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          padding: '1mm',
        }}
      >
        <div>
          <div style={{ fontSize: hasToBePaid ? '7mm' : '8.5mm', fontWeight: 900, lineHeight: 1 }}>
            {statusLabel}
          </div>
          {statusAmountLabel ? (
            <div style={{ marginTop: '0.8mm', fontSize: '6mm', fontWeight: 900, lineHeight: 1 }}>
              {statusAmountLabel}
            </div>
          ) : null}
        </div>
      </section>

      <section
        style={{
          border: '0.35mm solid #111',
          display: 'grid',
          gridTemplateRows: '8mm 1fr',
        }}
      >
        <div
          style={{
            borderBottom: '0.25mm solid #111',
            display: 'grid',
            placeItems: 'center',
            fontSize: '3mm',
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          Booking Code
        </div>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            fontSize: bookingCode.length > 14 ? '11mm' : '14mm',
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: '0',
            whiteSpace: 'nowrap',
          }}
        >
          {bookingCode}
        </div>
      </section>

      <main
        style={{
          minHeight: 0,
          display: 'grid',
          gridTemplateRows: 'repeat(8, minmax(0, auto))',
          gap: '1mm',
        }}
      >
        <StickerRow label="Receiver" value={receiverName} emphasis />
        <StickerRow label="Receiver Tel" value={receiverTelephones} />
        <StickerRow label="Destination Branch" value={destinationBranchName} emphasis />
        <StickerRow label="Destination Location" value={destinationLocationName} emphasis />
        <StickerRow label="Sender" value={senderName} />
        <StickerRow label="Sender Tel" value={senderTelephones} />
        <StickerRow label="Parcel Content" value={parcelContent || '-'} />
        <StickerRow label="Parcel Details" value={parcelDetails} />
      </main>

      <footer
        style={{
          borderTop: '0.35mm solid #111',
          display: 'grid',
          gridTemplateColumns: '1fr 24mm',
          gap: '2mm',
          alignItems: 'center',
          paddingTop: '1.5mm',
        }}
      >
        <div style={{ minWidth: 0, fontSize: '2.4mm', lineHeight: 1.18 }}>
          <div>
            <strong>Printed by:</strong> {printedByName?.trim() || '-'}
          </div>
          <div>{printedLocation || '-'}</div>
          <div style={{ marginTop: '0.7mm', fontWeight: 700 }}>Default paper: 100 x 150 mm</div>
        </div>
        <div
          style={{
            border: '0.25mm solid #111',
            fontSize: '2.7mm',
            fontWeight: 800,
            textAlign: 'center',
            padding: '1.2mm 0.8mm',
          }}
        >
          COPY 1/1
        </div>
      </footer>
    </div>
  );
}
