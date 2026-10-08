import { BrandedQrCode } from '@/components/ui/branded-qr-code';
import { InvoiceA5Header } from './invoice-a5-header';
import type { InvoiceA5TemplateProps } from './invoice-a5-template.types';
import { isToBePaidDeliveryReceipt } from './invoice-a5-template.utils';
import { InvoiceA5Summary } from './invoice-a5-summary';
import { receiptTaxRows } from './receipt-tax-rows';
import { useReceiptPaperFormat } from '../../hooks/use-receipt-paper-format';
import { ReceiptRollTemplate } from './receipt-roll-template';
import { InvoiceA5Terms } from './invoice-a5-terms';
import { ToBePaidReceiptA5Template } from './to-be-paid-receipt-a5-template';

export function InvoiceA5Template(props: InvoiceA5TemplateProps) {
  const paperFormat = useReceiptPaperFormat();
  if (paperFormat !== 'a5') return <ReceiptRollTemplate {...props} paperFormat={paperFormat} />;
  const {
    bookingCode,
    issuedAtLabel,
    parcelContent,
    parcelValueCedis,
    destinationBranchName,
    destinationLocationName,
    payerLabel,
    payerName,
    payerTelephone,
    senderPaidCedis,
    receiverToPayCedis,
    amountPaidCedis,
    storageChargeCedis = 0,
    amountInWords,
    cashierName,
    duplicate,
    tax,
    qrValue,
    formatMoney,
  } = props;

  if (isToBePaidDeliveryReceipt(props)) {
    return <ToBePaidReceiptA5Template {...props} />;
  }

  const isPartialReceipt = senderPaidCedis > 0 && receiverToPayCedis > 0;
  const totalPaid = amountPaidCedis;
  const priceBeforeTax = Math.max(totalPaid - tax.totalTax, 0);
  const valueOfParcelLabel =
    parcelValueCedis !== null && parcelValueCedis !== undefined
      ? formatMoney(parcelValueCedis)
      : '-';
  const destinationLabel = formatDestinationLabel(destinationBranchName, destinationLocationName);
  const taxRows = receiptTaxRows(tax);

  return (
    <div
      className="invoice-a5-root bg-white text-black"
      style={{
        width: '198mm',
        boxSizing: 'border-box',
        border: '0.35mm solid #111',
        padding: '2.6mm 3.2mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '3.6mm',
        lineHeight: 1.1,
      }}
    >
      <InvoiceA5Header
        issuedAtLabel={issuedAtLabel}
        title="Tax Invoice"
        subtitle={isPartialReceipt ? 'PARTIAL PAYMENT RECEIPT' : undefined}
        cashierName={cashierName}
        duplicate={duplicate}
      />

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
              <div style={{ fontWeight: 700 }}>{payerLabel}</div>
              <div style={{ marginTop: '0.5mm', fontWeight: 700, fontSize: '5.1mm' }}>
                {payerName}
              </div>
              <div style={{ marginTop: '0.2mm', fontSize: '5.1mm' }}>{payerTelephone || '-'}</div>
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
                  <div
                    style={{
                      marginTop: '0.45mm',
                      fontSize: '5.2mm',
                      fontWeight: 900,
                      lineHeight: 1,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {bookingCode}
                  </div>
                </div>
                <div style={{ paddingBottom: '0.5mm', paddingLeft: '1.6mm' }}>
                  <div style={{ fontWeight: 700 }}>Destination:</div>
                  <div style={{ marginTop: '0.3mm' }}>{destinationLabel}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4mm' }}>
          <BrandedQrCode
            value={qrValue}
            size={300}
            variant="print"
            ariaLabel="Parcel tracking QR code"
            className="self-center overflow-hidden"
            style={{ alignSelf: 'center', width: '34mm', height: '34mm', overflow: 'hidden' }}
          />
        </div>
      </div>

      <InvoiceA5Summary
        formatMoney={formatMoney}
        priceBeforeTax={priceBeforeTax}
        storageChargeCedis={storageChargeCedis}
        taxRows={taxRows}
        totalPaid={totalPaid}
      />
      <InvoiceA5Terms />
    </div>
  );
}

function formatDestinationLabel(branchName: string, locationName: string) {
  const branch = branchName.trim() || '-';
  const location = locationName.trim();
  if (!location || location === '-') return branch;
  return `${branch} (${location})`;
}
