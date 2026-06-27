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
        width: '90mm',
        height: '90mm',
        boxSizing: 'border-box',
        border: '0.35mm solid #111',
        padding: '1.2mm',
        fontFamily: 'Arial, sans-serif',
        display: 'grid',
        gridTemplateRows: '16mm 13mm 22mm 1fr',
        gap: '0.8mm',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: '11mm 1fr 16mm',
          alignItems: 'start',
          columnGap: '1.5mm',
        }}
      >
        <img
          src={logoPng}
          alt="Vipex logo"
          style={{ width: '10mm', height: '10mm', objectFit: 'contain' }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '4.4mm', fontWeight: 900, lineHeight: 0.85 }}>VIPEX</div>
          <div style={{ fontSize: '2.4mm', fontWeight: 800, lineHeight: 1 }}>Parcel Co. LTD</div>
          <div style={{ fontSize: '1.8mm', fontWeight: 700, lineHeight: 1.1 }}>
            Printed: {issuedAtLabel}
          </div>
          <div style={{ marginTop: '0.4mm', fontSize: '1.7mm', fontWeight: 700, lineHeight: 1.1 }}>
            <div>Printed by: {printedByName?.trim() || '-'}</div>
            <div>Source: {printedLocation || '-'}</div>
          </div>
        </div>
        <div
          aria-label="Parcel tracking QR code"
          style={{
            width: '16mm',
            height: '16mm',
            justifySelf: 'end',
            alignSelf: 'start',
            overflow: 'hidden',
          }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </header>

      <section
        style={{
          border: '0.35mm solid #111',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          padding: '0.8mm',
          overflow: 'hidden',
        }}
      >
        <div>
          <div
            style={{ fontSize: hasToBePaid ? '5.4mm' : '6.4mm', fontWeight: 900, lineHeight: 1 }}
          >
            {statusLabel}
          </div>
          {statusAmountLabel ? (
            <div style={{ marginTop: '0.3mm', fontSize: '4.6mm', fontWeight: 900, lineHeight: 1 }}>
              {statusAmountLabel}
            </div>
          ) : null}
        </div>
      </section>

      <section
        style={{
          border: '0.35mm solid #111',
          display: 'grid',
          gridTemplateRows: '5mm 1fr',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            borderBottom: '0.25mm solid #111',
            display: 'grid',
            placeItems: 'center',
            fontSize: '2.3mm',
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
            fontSize: bookingCode.length > 14 ? '8.6mm' : '10.5mm',
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
          gridTemplateRows: 'repeat(6, minmax(0, auto))',
          gap: '0.35mm',
          overflow: 'hidden',
        }}
      >
        <StickerRow label="Receiver" value={receiverName} emphasis />
        <StickerRow label="Receiver Tel" value={receiverTelephones} />
        <DestinationRow branch={destinationBranchName} location={destinationLocationName} />
        <StickerRow label="Sender" value={senderName} />
        <StickerRow label="Sender Tel" value={senderTelephones} />
        <StickerRow label="Parcel Details" value={parcelDetails} />
      </main>
    </div>
  );
}

function DestinationRow({
  branch,
  location,
}: {
  branch?: string | null;
  location?: string | null;
}) {
  return (
    <div style={{ minWidth: 0, borderTop: '0.35mm solid #111', paddingTop: '0.45mm' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.18fr 0.82fr',
          gap: '1mm',
          minWidth: 0,
        }}
      >
        <StickerRowContent label="Destination Branch" value={branch} scale="large" />
        <StickerRowContent label="Destination Location" value={location} />
      </div>
    </div>
  );
}

function StickerRowContent({
  label,
  value,
  scale = 'normal',
}: {
  label: string;
  value?: string | null;
  scale?: 'normal' | 'large';
}) {
  const displayValue = value?.trim() || '-';
  const fontSize =
    scale === 'large'
      ? displayValue.length > 18
        ? '6.6mm'
        : '8.4mm'
      : displayValue.length > 18
        ? '3.3mm'
        : '4.2mm';

  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: '2.2mm',
          fontWeight: 700,
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize,
          fontWeight: 800,
          lineHeight: scale === 'large' ? 0.92 : 1.04,
          overflowWrap: 'anywhere',
        }}
      >
        {displayValue}
      </div>
    </div>
  );
}
