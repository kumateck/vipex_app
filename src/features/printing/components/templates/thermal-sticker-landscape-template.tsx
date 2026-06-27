import { ThermalStickerHeaderPanel } from './thermal-sticker-header-panel';
import { ContactStack, InfoBlock, ParcelStack } from './thermal-sticker-info-sections';
import type { PreparedThermalStickerTemplateProps } from './thermal-sticker-template-types';

export function ThermalStickerLandscapeTemplate({
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
        gridTemplateColumns: '41mm 1fr 33mm',
        gap: '2.5mm',
      }}
    >
      <ThermalStickerHeaderPanel
        issuedAtLabel={issuedAtLabel}
        printedByName={printedByName}
        printedByBranchName={printedByBranchName}
        printedByLocationName={printedByLocationName}
      />

      <main
        style={{
          minWidth: 0,
          display: 'grid',
          gridTemplateRows: '13.5mm 1fr',
          borderLeft: '0.25mm solid #111',
          borderRight: '0.25mm solid #111',
        }}
      >
        <BookingHeader bookingCode={bookingCode} />

        <div
          style={{
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: '32mm minmax(0, 1.15fr) minmax(0, 1fr)',
            borderTop: '0.25mm solid #111',
            borderBottom: '0.25mm solid #111',
          }}
        >
          <InfoBlock
            label="Destination"
            primary={destinationBranchName}
            secondary={destinationLocationName}
          />
          <ContactStack
            senderName={senderName}
            senderTelephones={senderTelephones}
            receiverName={receiverName}
            receiverTelephones={receiverTelephones}
          />
          <ParcelStack parcelContent={parcelContent} parcelDetails={parcelDetails} />
        </div>
      </main>

      <aside
        style={{
          display: 'grid',
          gridTemplateRows: hasToBePaid ? '16mm 23mm 1fr' : '11mm 23mm 1fr',
          alignItems: 'start',
          justifyItems: 'center',
          minWidth: 0,
          gap: '1.5mm',
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
          </div>
        </div>
        <div
          aria-label="Parcel tracking QR code"
          style={{ width: '24mm', height: '24mm' }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div
          style={{
            alignSelf: 'end',
            width: '100%',
            border: '0.25mm solid #111',
            fontSize: '2.6mm',
            fontWeight: 700,
            textAlign: 'center',
            padding: '1mm 0.6mm',
          }}
        >
          COPY 1/1
        </div>
      </aside>
    </div>
  );
}

function BookingHeader({ bookingCode }: { bookingCode: string }) {
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        alignItems: 'center',
        padding: '1mm 2mm',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '3mm', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>
        Booking Code
      </div>
      <div style={{ fontSize: '9mm', fontWeight: 800, lineHeight: 0.95, whiteSpace: 'nowrap' }}>
        {bookingCode}
      </div>
    </header>
  );
}
