import { QRCode } from 'react-qrcode-logo';
import logoPng from '@/assets/logo.png';
import { InvoiceTaxSummary } from './invoice-tax-summary';

type InvoiceA5TemplateProps = {
  bookingCode: string;
  issuedAtLabel: string;
  parcelDetails: string;
  parcelContent?: string | null;
  parcelValueCedis?: number | null;
  receivedByName?: string | null;
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
    totalTax: number;
  };
  qrValue: string;
  formatMoney: (amount: number) => string;
};

export function InvoiceA5Template(props: InvoiceA5TemplateProps) {
  const {
    bookingCode,
    issuedAtLabel,
    parcelContent,
    parcelValueCedis,
    receivedByName,
    destinationBranchName,
    destinationLocationName,
    senderName,
    senderTelephone,
    receiverName,
    receiverTelephone,
    senderPaidCedis,
    receiverToPayCedis,
    amountPaidCedis,
    amountInWords,
    tax,
    qrValue,
    formatMoney,
  } = props;

  const isToBePaidReceipt = senderPaidCedis <= 0 && receiverToPayCedis > 0;
  const isPartialReceipt = senderPaidCedis > 0 && receiverToPayCedis > 0;
  const totalPaid = amountPaidCedis;
  const priceBeforeTax = Math.max(totalPaid - tax.totalTax, 0);
  const valueOfParcelLabel =
    parcelValueCedis !== null && parcelValueCedis !== undefined
      ? formatMoney(parcelValueCedis)
      : '-';
  const destinationLabel = formatDestinationLabel(destinationBranchName, destinationLocationName);
  const taxRows = [
    { label: 'GETFUND', value: tax.getfund },
    { label: 'NHIL', value: tax.nhil },
    { label: 'VAT', value: tax.vat },
  ];

  return (
    <div
      className="invoice-a5-root bg-white text-black"
      style={{
        width: '198mm',
        border: '0.35mm solid #111',
        padding: '2.6mm 3.2mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '3.6mm',
        lineHeight: 1.1,
      }}
    >
      <div
        style={{ borderBottom: '0.28mm solid #111', paddingBottom: '1.1mm', marginBottom: '1.1mm' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '2.4mm',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6mm' }}>
              <img
                src={logoPng}
                alt="Vipex logo"
                style={{ width: '16mm', height: '16mm', objectFit: 'contain' }}
              />
              <div>
                <div style={{ fontSize: '6.8mm', fontWeight: 700, lineHeight: 1 }}>
                  VIPEX COMPANY LTD
                </div>
                <div style={{ fontSize: '6.8mm', fontWeight: 700, lineHeight: 0.92 }}>PARCELS</div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '50mm' }}>
            <div style={{ fontSize: '6.8mm', fontWeight: 700 }}>Tax Invoice</div>
            <div style={{ fontSize: '5mm', marginTop: '0.4mm' }}>TIN #: C0003621138</div>
            {isToBePaidReceipt ? (
              <div style={{ marginTop: '0.5mm', fontSize: '4.4mm', fontWeight: 700 }}>
                TO BE PAID RECEIPT
              </div>
            ) : null}
            {isPartialReceipt ? (
              <div style={{ marginTop: '0.5mm', fontSize: '4.4mm', fontWeight: 700 }}>
                PARTIAL PAYMENT RECEIPT
              </div>
            ) : null}
            {isToBePaidReceipt || isPartialReceipt ? (
              <div
                style={{ marginTop: '0.4mm', fontSize: '2.6mm', fontWeight: 600, lineHeight: 1.15 }}
              >
                Disclaimer: Sender did not pay at the point of sending.
              </div>
            ) : null}
          </div>

          <div style={{ textAlign: 'right', fontSize: '3.1mm', minWidth: '46mm' }}>
            <div>P. O. BOX 16875 - Kumasi - Ashanti</div>
            <div style={{ marginTop: '0.4mm' }}>user: SYSTEM</div>
            <div style={{ marginTop: '0.7mm' }}>Date: {issuedAtLabel}</div>
          </div>
        </div>

        <div
          style={{
            marginTop: '0.8mm',
            fontSize: '3.6mm',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          Kumasi (Accra): 0204353512 / 0540121502 | Accra (Kumasi): 0204353513 / 0507243966 |
          Sunyani (Accra): 0540121503 / 0204252090 | Accra (Sunyani): 0540305280
          <br />
          Kumasi (Sunyani): 0204353512 | Sunyani (Kumasi): 0540121503
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 53mm',
          gap: '2.6mm',
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              borderBottom: '0.24mm solid #111',
            }}
          >
            <div
              style={{
                paddingBottom: '0.9mm',
                borderRight: '0.24mm solid #111',
                paddingRight: '1.6mm',
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {isToBePaidReceipt ? 'Receiver Info' : 'Sender Info'}
              </div>
              <div style={{ marginTop: '0.5mm', fontWeight: 700, fontSize: '5.1mm' }}>
                {isToBePaidReceipt ? receiverName : senderName}
              </div>
              <div style={{ marginTop: '0.2mm', fontSize: '5.1mm' }}>
                {isToBePaidReceipt ? receiverTelephone || '-' : senderTelephone || '-'}
              </div>
            </div>
            <div style={{ paddingLeft: '1.6mm', paddingBottom: '0.9mm' }}>
              <div style={{ fontWeight: 700 }}>Amount in Words</div>
              <div style={{ marginTop: '0.5mm' }}>{amountInWords}</div>
            </div>
          </div>

          <div style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>
            <div style={{ marginTop: '0.4mm' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div
                  style={{
                    borderBottom: '0.2mm solid #222',
                    borderRight: '0.24mm solid #111',
                    paddingBottom: '0.5mm',
                    paddingRight: '1.6mm',
                  }}
                >
                  <div style={{ fontWeight: 700 }}># Content</div>
                  <div style={{ marginTop: '0.3mm' }}>{parcelContent || '-'}</div>
                </div>
                <div
                  style={{
                    borderBottom: '0.2mm solid #222',
                    paddingBottom: '0.5mm',
                    paddingLeft: '1.6mm',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Value of Parcel(s):</div>
                  <div style={{ marginTop: '0.3mm' }}>{valueOfParcelLabel}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: '0.3mm' }}>
                <div
                  style={{
                    paddingBottom: '0.5mm',
                    borderRight: '0.24mm solid #111',
                    paddingRight: '1.6mm',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Code No:</div>
                  <div style={{ marginTop: '0.3mm' }}>{bookingCode}</div>
                </div>
                <div style={{ paddingBottom: '0.5mm', paddingLeft: '1.6mm' }}>
                  <div style={{ fontWeight: 700 }}>Destination:</div>
                  <div style={{ marginTop: '0.3mm' }}>{destinationLabel}</div>
                </div>
              </div>

              {isToBePaidReceipt ? (
                <div
                  style={{
                    marginTop: '0.3mm',
                    borderTop: '0.2mm solid #222',
                    paddingTop: '0.5mm',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Parcel Received By:</div>
                  <div style={{ marginTop: '0.3mm' }}>{receivedByName || receiverName || '-'}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4mm' }}>
          <div style={{ alignSelf: 'center' }}>
            <QRCode value={qrValue} size={130} quietZone={1} ecLevel="M" />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '0.28mm solid #111', paddingTop: '1.1mm' }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.6mm', height: '100%' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingLeft: '5mm',
            }}
          >
            <div style={{ fontSize: '4.8mm', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
              TERMS AND CONDITIONS APPLY
            </div>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div
              style={{
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '4.2mm',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                padding: '1.2mm 0 1mm',
              }}
            >
              Being: cost of courier service
            </div>

            <InvoiceTaxSummary
              formatMoney={formatMoney}
              isToBePaidReceipt={isToBePaidReceipt}
              priceBeforeTax={priceBeforeTax}
              taxRows={taxRows}
              totalPaid={totalPaid}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDestinationLabel(branchName: string, locationName: string) {
  const branch = branchName.trim() || '-';
  const location = locationName.trim();
  if (!location || location === '-') return branch;
  return `${branch} (${location})`;
}
