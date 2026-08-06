import logoPng from '@/assets/logo.png';
import { VIPEX_BRANCH_CONTACTS } from './thermal-sticker-contacts';
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
  const statusRowHeight = hasToBePaid ? '13mm' : '11mm';

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
        gridTemplateRows: `16mm ${statusRowHeight} 13mm 1fr`,
        gap: '0.6mm',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: '11mm 1fr 24mm 16mm',
          gridTemplateRows: '8mm 7mm',
          alignItems: 'start',
          columnGap: '1.5mm',
          rowGap: '0.6mm',
        }}
      >
        <img
          src={logoPng}
          alt="Vipex logo"
          style={{
            width: '10mm',
            height: '10mm',
            objectFit: 'contain',
            gridRow: '1 / 3',
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '4.4mm', fontWeight: 900, lineHeight: 0.85 }}>VIPEX</div>
          <div style={{ fontSize: '2.4mm', fontWeight: 800, lineHeight: 1 }}>Parcels</div>
        </div>
        <PortraitBranchContacts />
        <div
          style={{
            minWidth: 0,
            justifySelf: 'end',
            alignSelf: 'start',
            marginRight: '1.5mm',
            fontSize: '1.5mm',
            fontWeight: 800,
            lineHeight: 1.15,
            overflowWrap: 'anywhere',
          }}
        >
          <div>Printed: {issuedAtLabel}</div>
          <div style={{ marginTop: '0.35mm' }}>Printed by: {printedByName?.trim() || '-'}</div>
          <div style={{ marginTop: '0.3mm' }}>Source: {printedLocation || '-'}</div>
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
              style={{ marginTop: '0.3mm', fontSize: '1.5mm', fontWeight: 700, lineHeight: 1.05 }}
            >
              Sender did not pay at the point of sending
            </div>
          ) : null}
        </div>
      </section>

      <section
        style={{
          border: '0.35mm solid #111',
          display: 'grid',
          minWidth: 0,
          overflow: 'hidden',
          placeItems: 'center',
          textAlign: 'center',
          padding: '0.3mm 1mm',
        }}
      >
        <div style={{ minWidth: 0 }}>
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
              marginTop: '0.25mm',
              fontSize: receiverNameFontSize(receiverName),
              fontWeight: 900,
              lineHeight: 0.95,
              overflowWrap: 'anywhere',
            }}
          >
            {receiverName}
          </div>
          <div style={{ marginTop: '0.3mm', fontSize: '3.2mm', fontWeight: 800, lineHeight: 1 }}>
            {receiverTelephones}
          </div>
        </div>
      </section>

      <main
        style={{
          minHeight: 0,
          display: 'grid',
          gridTemplateRows: '12mm 7mm 7mm 1fr 5mm',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        <DestinationRow branch={destinationBranchName} location={destinationLocationName} />
        <StickerRow label="Sender" value={senderName} />
        <StickerRow label="Sender Tel" value={senderTelephones} />
        <StickerRow label="Parcel Details" value={parcelDetails} />
        <div
          style={{
            minWidth: 0,
            borderTop: '0.35mm solid #111',
            boxSizing: 'border-box',
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: '2.4mm', fontWeight: 700, letterSpacing: '0.02em' }}>
            {bookingCode}
          </div>
        </div>
      </main>
    </div>
  );
}

function receiverNameFontSize(name: string) {
  const length = name.length;
  if (length > 26) return '3.2mm';
  if (length > 18) return '4mm';
  if (length > 12) return '5mm';
  return '6mm';
}

function PortraitBranchContacts() {
  return (
    <div
      style={{
        gridColumn: '2 / 4',
        gridRow: 2,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        columnGap: '0.8mm',
        rowGap: '0.15mm',
        minWidth: 0,
        fontSize: '1.5mm',
        fontWeight: 800,
        lineHeight: 0.92,
        overflow: 'hidden',
      }}
    >
      {VIPEX_BRANCH_CONTACTS.map((contact) => (
        <div key={contact.route} style={{ minWidth: 0 }}>
          <div style={{ whiteSpace: 'nowrap' }}>{contact.route}:</div>
          <div style={{ whiteSpace: 'nowrap' }}>{contact.phones}</div>
        </div>
      ))}
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
    <div
      style={{
        minWidth: 0,
        borderTop: '0.35mm solid #111',
        padding: '0.35mm 0',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 0.75fr',
          gap: '1.2mm',
          minWidth: 0,
        }}
      >
        <StickerRowContent label="Destination" value={branch} scale="large" />
        <StickerRowContent label="Location" value={location} />
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
          fontSize: '2mm',
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
          lineHeight: scale === 'large' ? 0.86 : 0.96,
          overflowWrap: 'anywhere',
        }}
      >
        {displayValue}
      </div>
    </div>
  );
}
