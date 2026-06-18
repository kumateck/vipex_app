type InvoiceTaxSummaryProps = {
  formatMoney: (amount: number) => string;
  isToBePaidReceipt: boolean;
  priceBeforeTax: number;
  taxRows: Array<{ label: string; value: number }>;
  totalPaid: number;
};

export function InvoiceTaxSummary({
  formatMoney,
  isToBePaidReceipt,
  priceBeforeTax,
  taxRows,
  totalPaid,
}: InvoiceTaxSummaryProps) {
  return (
    <div
      style={{
        border: '0.28mm solid #111',
        padding: '1.2mm 1.6mm',
        fontSize: '5.2mm',
        width: '100%',
        alignSelf: 'stretch',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: '8.5mm' }}>
        <span>Price:</span>
        <span style={{ whiteSpace: 'nowrap' }}>{formatMoney(priceBeforeTax)}</span>
      </div>
      {taxRows.map((row) => (
        <div
          key={row.label}
          style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: '8.5mm' }}
        >
          <span>{row.label}:</span>
          <span style={{ whiteSpace: 'nowrap' }}>{formatMoney(row.value)}</span>
        </div>
      ))}
      <div
        style={{
          borderTop: '0.2mm solid #333',
          marginTop: '0.55mm',
          paddingTop: '0.55mm',
          fontWeight: 700,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          columnGap: '8.5mm',
        }}
      >
        <span>{isToBePaidReceipt ? 'To Be Paid:' : 'Total:'}</span>
        <span style={{ whiteSpace: 'nowrap' }}>{formatMoney(totalPaid)}</span>
      </div>
    </div>
  );
}
