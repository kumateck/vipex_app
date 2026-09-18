const RECEIPT_TERMS = [
  'Parcels not collected within two weeks will incur a daily storage fee of GH₵2.',
  'Information collected will be used only for the intended purpose and handled in accordance with applicable data protection requirements.',
] as const;

export function InvoiceA5Terms() {
  return (
    <div
      style={{
        borderTop: '0.28mm solid #111',
        marginTop: '1.1mm',
        paddingTop: '1mm',
        fontSize: '2.7mm',
        lineHeight: 1.2,
      }}
    >
      <div style={{ fontWeight: 700 }}>TERMS AND CONDITIONS</div>
      {RECEIPT_TERMS.map((term) => (
        <div key={term} style={{ marginTop: '0.4mm' }}>
          • {term}
        </div>
      ))}
    </div>
  );
}
