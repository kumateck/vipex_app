import logoPng from '@/assets/logo.png';
import { createQrSvg, formatTelephones, StickerRow } from './thermal-sticker-template-utils';

type ThermalStickerTemplateProps = {
  bookingCode: string;
  receiverName: string;
  receiverTelephone: string;
  receiverTelephone2?: string | null;
  destinationBranchName: string;
  destinationLocationName: string;
  isPaid: boolean;
  toBePaidCedis?: number;
  qrValue: string;
  formatMoney: (amount: number) => string;
  orientation?: 'landscape' | 'portrait';
};

export function ThermalStickerTemplate(props: ThermalStickerTemplateProps) {
  const {
    bookingCode,
    receiverName,
    receiverTelephone,
    receiverTelephone2,
    destinationBranchName,
    destinationLocationName,
    isPaid,
    toBePaidCedis,
    qrValue,
    formatMoney,
    orientation = 'landscape',
  } = props;
  const hasToBePaid = typeof toBePaidCedis === 'number' && toBePaidCedis > 0;
  const statusLabel = hasToBePaid ? `TO BE PAID ${formatMoney(toBePaidCedis)}` : 'PAID';
  const qrSvg = createQrSvg(qrValue);
  const receiverTelephones = formatTelephones(receiverTelephone, receiverTelephone2);
  const commonProps = {
    bookingCode,
    receiverName,
    receiverTelephones,
    destinationBranchName,
    destinationLocationName,
    statusLabel,
    isPaid,
    hasToBePaid,
    qrSvg,
  };

  if (orientation === 'portrait') {
    return <PortraitStickerTemplate {...commonProps} />;
  }

  return <LandscapeStickerTemplate {...commonProps} />;
}

type StickerLayoutProps = {
  bookingCode: string;
  receiverName: string;
  receiverTelephones: string;
  destinationBranchName: string;
  destinationLocationName: string;
  statusLabel: string;
  isPaid: boolean;
  hasToBePaid: boolean;
  qrSvg: string;
};

function LandscapeStickerTemplate({
  bookingCode,
  receiverName,
  receiverTelephones,
  destinationBranchName,
  destinationLocationName,
  statusLabel,
  isPaid,
  hasToBePaid,
  qrSvg,
}: StickerLayoutProps) {
  return (
    <div
      className="bg-white text-black"
      style={{
        width: '79.5mm',
        height: '77.5mm',
        boxSizing: 'border-box',
        border: '0.35mm solid #111',
        padding: '1.4mm',
        fontFamily: 'Arial, sans-serif',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 23mm',
        columnGap: '2mm',
      }}
    >
      <div
        style={{
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6mm',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: hasToBePaid ? '4.1mm' : '5mm',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'visible',
            border: '0.35mm solid #111',
            borderRadius: '1.1mm',
            padding: '0.8mm 1.2mm',
            textAlign: 'center',
            background: isPaid && !hasToBePaid ? '#dcfce7' : '#fef3c7',
          }}
        >
          {statusLabel}
        </div>

        <StickerRow label="Booking" value={bookingCode} emphasis noWrap />
        <StickerRow label="Receiver" value={receiverName} emphasis noWrap />
        <StickerRow label="Tel" value={receiverTelephones} noWrap />
        <StickerRow label="Branch" value={destinationBranchName} emphasis />
        <StickerRow label="Location" value={destinationLocationName} emphasis />
      </div>

      <div
        style={{
          width: '23mm',
          display: 'grid',
          gridTemplateRows: '12mm 1fr',
          alignItems: 'start',
          justifyItems: 'center',
          gap: '1.4mm',
          minWidth: 0,
        }}
      >
        <img
          src={logoPng}
          alt="Vipex logo"
          style={{ width: '12mm', height: '12mm', objectFit: 'contain' }}
        />
        <div
          aria-label="Parcel tracking QR code"
          style={{
            width: '23mm',
            height: '23mm',
          }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </div>
    </div>
  );
}

function PortraitStickerTemplate({
  bookingCode,
  receiverName,
  receiverTelephones,
  destinationBranchName,
  destinationLocationName,
  statusLabel,
  hasToBePaid,
  qrSvg,
}: StickerLayoutProps) {
  return (
    <div
      className="bg-white text-black"
      style={{
        width: '76mm',
        height: '75mm',
        boxSizing: 'border-box',
        border: '0.35mm solid #111',
        padding: '1.6mm',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '1mm',
      }}
    >
      <div
        style={{
          height: '30mm',
          display: 'grid',
          gridTemplateColumns: '24mm 29mm',
          columnGap: '2mm',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            minWidth: 0,
            height: '30mm',
            display: 'grid',
            gridTemplateRows: '1fr 6.5mm',
            alignItems: 'center',
            justifyItems: 'center',
          }}
        >
          <img
            src={logoPng}
            alt="Vipex logo"
            style={{ width: '22mm', height: '22mm', objectFit: 'contain' }}
          />
          <div
            style={{
              width: '100%',
              fontWeight: 700,
              fontSize: hasToBePaid ? '3.7mm' : '4.8mm',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {statusLabel}
          </div>
        </div>
        <div
          aria-label="Parcel tracking QR code"
          style={{
            width: '29mm',
            height: '29mm',
            justifySelf: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </div>

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.7mm' }}>
        <StickerRow label="Booking" value={bookingCode} align="center" emphasis noWrap />
        <StickerRow label="Receiver" value={receiverName} align="center" emphasis noWrap />
        <StickerRow label="Tel" value={receiverTelephones} align="center" noWrap />
        <StickerRow label="Branch" value={destinationBranchName} align="center" emphasis noWrap />
        <StickerRow
          label="Location"
          value={destinationLocationName}
          align="center"
          emphasis
          noWrap
        />
      </div>
    </div>
  );
}
