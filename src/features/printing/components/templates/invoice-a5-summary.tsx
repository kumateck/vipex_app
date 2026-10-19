import { InvoiceTaxSummary } from './invoice-tax-summary';

export function InvoiceA5Summary({
  formatMoney,
  priceBeforeTax,
  storageChargeCedis,
  taxRows,
  totalPaid,
}: {
  formatMoney: (amount: number) => string;
  priceBeforeTax: number;
  storageChargeCedis: number;
  taxRows: Array<{ label: string; value: number }>;
  totalPaid: number;
}) {
  return (
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

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
            isToBePaidReceipt={false}
            priceBeforeTax={priceBeforeTax}
            storageChargeCedis={storageChargeCedis}
            taxRows={taxRows}
            totalPaid={totalPaid}
          />
        </div>
      </div>
    </div>
  );
}
