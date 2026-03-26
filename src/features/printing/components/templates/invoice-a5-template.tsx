import { QRCode } from 'react-qrcode-logo';
import logoPng from '@/assets/logo.png';

type InvoiceA5TemplateProps = {
  bookingCode: string;
  issuedAtLabel: string;
  parcelDetails: string;
  destinationBranchName: string;
  destinationLocationName: string;
  senderName: string;
  senderTelephone: string;
  receiverName: string;
  receiverTelephone: string;
  paymentModeLabel: string;
  totalChargeCedis: number;
  senderPaidCedis: number;
  receiverToPayCedis: number;
  amountPaidCedis: number;
  amountInWords: string;
  tax: {
    vat: number;
    getfund: number;
    nhil: number;
    covid: number;
    totalTax: number;
  };
  qrValue: string;
  formatMoney: (amount: number) => string;
};

export function InvoiceA5Template(props: InvoiceA5TemplateProps) {
  const {
    bookingCode,
    issuedAtLabel,
    parcelDetails,
    destinationBranchName,
    destinationLocationName,
    senderName,
    senderTelephone,
    receiverName,
    receiverTelephone,
    paymentModeLabel,
    totalChargeCedis,
    senderPaidCedis,
    receiverToPayCedis,
    amountPaidCedis,
    amountInWords,
    tax,
    qrValue,
    formatMoney,
  } = props;

  const isToBePaidReceipt = senderPaidCedis <= 0 && receiverToPayCedis > 0;
  const paymentHeadline = isToBePaidReceipt
    ? `Receiver paid: ${formatMoney(amountPaidCedis)}`
    : `Amount Paid: ${formatMoney(amountPaidCedis)}`;

  return (
    <div
      className="bg-white text-black"
      style={{
        width: '198mm',
        minHeight: '136mm',
        border: '0.35mm solid #111',
        padding: '3.2mm 4mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '3.6mm',
        lineHeight: 1.15,
      }}
    >
      <div
        style={{ borderBottom: '0.3mm solid #111', paddingBottom: '1.4mm', marginBottom: '1.4mm' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '4mm',
          }}
        >
          <div>
            <img
              src={logoPng}
              alt="Vipex logo"
              style={{ width: '13mm', height: '13mm', objectFit: 'contain', marginBottom: '0.9mm' }}
            />
            <div style={{ fontSize: '5.7mm', fontWeight: 700, lineHeight: 1 }}>VIPEX CO. LTD</div>
            <div style={{ fontSize: '5.7mm', fontWeight: 700, lineHeight: 1 }}>PARCELS</div>
            <div style={{ marginTop: '0.7mm', fontSize: '3mm' }}>
              Kumasi (Accra) | 024353512/054021502 | Accra (Kumasi) | 024353512/054021503
            </div>
            <div style={{ marginTop: '0.4mm', fontSize: '3mm' }}>user: SYSTEM</div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '38mm' }}>
            <div style={{ fontSize: '5.4mm', fontWeight: 700 }}>Tax Invoice</div>
            <div style={{ fontSize: '4mm', marginTop: '0.7mm' }}>TIN #: C0003621138</div>
            {isToBePaidReceipt ? (
              <div style={{ marginTop: '0.8mm', fontSize: '4.3mm', fontWeight: 700 }}>
                TO BE PAID RECEIPT
              </div>
            ) : null}
          </div>

          <div style={{ textAlign: 'right', fontSize: '3mm' }}>
            <div>P. O. BOX 16875 - Kumasi - Ashanti</div>
            <div>https://vipexparcel.com</div>
            <div>Date: {issuedAtLabel}</div>
          </div>
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 37mm', gap: '3mm', minHeight: '89mm' }}
      >
        <div>
          <div
            style={{ borderBottom: '0.25mm solid #111', paddingBottom: '1mm', marginBottom: '1mm' }}
          >
            <div style={{ fontWeight: 700 }}>
              {isToBePaidReceipt ? 'Receiver Info' : 'Sender Info'}
            </div>
            <div style={{ marginTop: '0.5mm', fontWeight: 700 }}>
              {isToBePaidReceipt ? receiverName : senderName}
            </div>
            <div>{isToBePaidReceipt ? receiverTelephone || '-' : senderTelephone || '-'}</div>
            <div style={{ marginTop: '0.5mm' }}>{amountInWords}</div>
            <div style={{ marginTop: '0.3mm', fontSize: '3mm' }}>Customer TIN</div>
          </div>

          <div
            style={{ borderBottom: '0.25mm solid #111', paddingBottom: '1mm', marginBottom: '1mm' }}
          >
            <div style={{ fontWeight: 700 }}>Being: Cost of Courier Services</div>
            <div style={{ marginTop: '0.6mm', fontWeight: 700 }}>{paymentHeadline}</div>
            <div style={{ marginTop: '0.6mm' }}>Value of Parcel(s): {parcelDetails || '-'}</div>
            <div style={{ marginTop: '0.6mm', fontWeight: 700 }}>Code No. {bookingCode}</div>
            <div style={{ marginTop: '0.6mm' }}>Destination: {destinationBranchName}</div>
            <div style={{ marginTop: '0.6mm' }}>Location: {destinationLocationName}</div>
            <div style={{ marginTop: '0.6mm' }}>Payment Mode: {paymentModeLabel}</div>
          </div>

          <div
            style={{ borderBottom: '0.25mm solid #111', paddingBottom: '1mm', marginBottom: '1mm' }}
          >
            <div style={{ minHeight: '19mm' }} />
            <div style={{ textAlign: 'center', fontSize: '5.4mm', letterSpacing: '0.2mm' }}>
              TERMS AND CONDITIONS APPLY
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ alignSelf: 'center', marginTop: '1.4mm' }}>
            <QRCode value={qrValue} size={112} quietZone={1} ecLevel="M" />
          </div>

          <div style={{ border: '0.3mm solid #111', padding: '1.6mm', fontSize: '3.4mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Price:</span>
              <span>{formatMoney(totalChargeCedis)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GETFUND:</span>
              <span>{formatMoney(tax.getfund)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>NHIL:</span>
              <span>{formatMoney(tax.nhil)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>VAT:</span>
              <span>{formatMoney(tax.vat)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>COVID:</span>
              <span>{formatMoney(tax.covid)}</span>
            </div>
            <div
              style={{
                borderTop: '0.2mm dashed #333',
                marginTop: '1mm',
                paddingTop: '1mm',
                fontWeight: 700,
              }}
            >
              {isToBePaidReceipt
                ? `To be Paid: ${formatMoney(amountPaidCedis)}`
                : `Amount Paid: ${formatMoney(amountPaidCedis)}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
