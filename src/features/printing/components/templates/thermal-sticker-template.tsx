import { QRCode } from 'react-qrcode-logo';
import logoPng from '@/assets/logo.png';

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
  } = props;
  const hasToBePaid = typeof toBePaidCedis === 'number' && toBePaidCedis > 0;
  const statusLabel = hasToBePaid ? `TO BE PAID ${formatMoney(toBePaidCedis)}` : 'PAID';

  return (
    <div
      className="bg-white text-black"
      style={{
        width: '78mm',
        border: '0.35mm solid #111',
        padding: '1.4mm',
        fontFamily: 'Arial, sans-serif',
        display: 'grid',
        gridTemplateColumns: '1fr 28mm',
        gap: '1.4mm',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: hasToBePaid ? '4.1mm' : '5mm',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            border: '0.35mm solid #111',
            borderRadius: '1.1mm',
            padding: '0.9mm 1.2mm',
            textAlign: 'center',
            background: isPaid && !hasToBePaid ? '#dcfce7' : '#fef3c7',
          }}
        >
          {statusLabel}
        </div>

        <StickerRow label="Booking" value={bookingCode} emphasis />
        <StickerRow label="Receiver" value={receiverName} emphasis />
        <StickerRow label="Tel 1" value={receiverTelephone} />
        {receiverTelephone2?.trim() ? (
          <StickerRow label="Tel 2" value={receiverTelephone2} />
        ) : null}
        <StickerRow label="Branch" value={destinationBranchName} emphasis />
        <StickerRow label="Location" value={destinationLocationName} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2mm' }}>
        <img
          src={logoPng}
          alt="Vipex logo"
          style={{ width: '14mm', height: '14mm', objectFit: 'contain' }}
        />
        <QRCode value={qrValue} size={88} quietZone={1} ecLevel="M" />
      </div>
    </div>
  );
}

type StickerRowProps = {
  label: string;
  value?: string | null;
  emphasis?: boolean;
};

function StickerRow({ label, value, emphasis = false }: StickerRowProps) {
  return (
    <>
      <div style={{ borderTop: '0.35mm solid #111', margin: '0.8mm 0' }} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '2.4mm',
            fontWeight: 700,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '0',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: emphasis ? '4.9mm' : '4.35mm',
            lineHeight: 1.04,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {value?.trim() || '-'}
        </div>
      </div>
    </>
  );
}
