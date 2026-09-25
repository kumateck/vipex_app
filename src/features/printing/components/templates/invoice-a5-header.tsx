import logoPng from '@/assets/logo.png';

type InvoiceA5HeaderProps = {
  issuedAtLabel: string;
  title: 'Tax Invoice' | 'ACKNOWLEDGEMENT NOTE' | 'HOME DELIVERY RECEIPT';
  subtitle?: string;
};

export function InvoiceA5Header({ issuedAtLabel, title, subtitle }: InvoiceA5HeaderProps) {
  return (
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
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: '50mm' }}>
          <div style={{ fontSize: '6.8mm', fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: '5mm', marginTop: '0.4mm' }}>TIN #: C0003621138</div>
          {subtitle ? (
            <div style={{ marginTop: '0.5mm', fontSize: '4.4mm', fontWeight: 700 }}>{subtitle}</div>
          ) : null}
        </div>

        <div style={{ textAlign: 'right', fontSize: '3.1mm', minWidth: '46mm' }}>
          <div>P. O. BOX 16875 - Kumasi - Ashanti</div>
          <div style={{ marginTop: '0.4mm' }}>user: SYSTEM</div>
          <div style={{ marginTop: '0.7mm' }}>Date: {issuedAtLabel}</div>
        </div>
      </div>

      <div style={{ marginTop: '0.8mm', fontSize: '3.6mm', textAlign: 'center', lineHeight: 1.2 }}>
        Kumasi (Accra): 0204353512 / 0540121502 | Accra (Kumasi): 0204353513 / 0507243966 | Sunyani
        (Accra): 0540121503 / 0204252090 | Accra (Sunyani): 0540305280
        <br />
        Kumasi (Sunyani): 0204353512 | Sunyani (Kumasi): 0540121503 | Techiman: 0559085369 | Tamale:
        0502638678
      </div>
    </div>
  );
}
