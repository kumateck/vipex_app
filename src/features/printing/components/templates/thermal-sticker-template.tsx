import { QRCode } from 'react-qrcode-logo';
import logoPng from '@/assets/logo.png';

type ThermalStickerTemplateProps = {
  senderName: string;
  senderTelephone: string;
  bookingCode: string;
  parcelDetails: string;
  destinationBranchName: string;
  destinationLocationName: string;
  toBePaidCedis?: number;
  qrValue: string;
  formatMoney: (amount: number) => string;
};

export function ThermalStickerTemplate(props: ThermalStickerTemplateProps) {
  const {
    senderName,
    senderTelephone,
    bookingCode,
    parcelDetails,
    destinationBranchName,
    destinationLocationName,
    toBePaidCedis,
    qrValue,
    formatMoney,
  } = props;

  return (
    <div
      className="bg-white text-black"
      style={{
        width: '78mm',
        border: '0.35mm solid #111',
        padding: '1.3mm',
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
            fontSize: '7.6mm',
            lineHeight: 1.02,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {senderName}
        </div>
        <div style={{ borderTop: '0.35mm solid #111', margin: '0.8mm 0' }} />
        <div
          style={{
            fontWeight: 700,
            fontSize: '6.7mm',
            lineHeight: 1.02,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {senderTelephone || '-'}
        </div>
        <div style={{ borderTop: '0.35mm solid #111', margin: '0.8mm 0' }} />
        <div
          style={{
            fontWeight: 700,
            fontSize: '7.2mm',
            lineHeight: 1.02,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {bookingCode}
        </div>
        <div style={{ borderTop: '0.35mm solid #111', margin: '0.8mm 0' }} />
        <div
          style={{
            fontWeight: 700,
            fontSize: '6.6mm',
            lineHeight: 1.02,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {parcelDetails || '-'}
        </div>

        {typeof toBePaidCedis === 'number' && toBePaidCedis > 0 ? (
          <>
            <div style={{ borderTop: '0.35mm solid #111', margin: '0.8mm 0' }} />
            <div
              style={{ fontWeight: 700, fontSize: '5.8mm', lineHeight: 1.02, whiteSpace: 'nowrap' }}
            >
              TO BE PAID: {formatMoney(toBePaidCedis)}
            </div>
          </>
        ) : null}

        <div style={{ borderTop: '0.35mm solid #111', margin: '0.8mm 0' }} />
        <div
          style={{
            fontWeight: 700,
            fontSize: '6.6mm',
            lineHeight: 1.02,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {destinationBranchName}
        </div>
        <div style={{ borderTop: '0.35mm solid #111', margin: '0.8mm 0' }} />
        <div
          style={{
            fontWeight: 700,
            fontSize: '6.6mm',
            lineHeight: 1.02,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {destinationLocationName}
        </div>
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
