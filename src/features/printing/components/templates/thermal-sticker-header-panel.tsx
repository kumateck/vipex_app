import { VIPEX_BRANCH_CONTACTS } from './thermal-sticker-contacts';
import logoPng from '@/assets/logo.png';

export function ThermalStickerHeaderPanel() {
  return (
    <section
      style={{
        minWidth: 0,
        display: 'grid',
        gridTemplateRows: '17mm 1fr',
        gap: '1.5mm',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
        <img
          src={logoPng}
          alt="Vipex logo"
          style={{ width: '15mm', height: '15mm', objectFit: 'contain' }}
        />
        <div>
          <div style={{ fontSize: '5mm', fontWeight: 800, lineHeight: 0.95 }}>VIPEX</div>
          <div style={{ fontSize: '3.2mm', fontWeight: 800, lineHeight: 1 }}>Parcel Co. LTD</div>
        </div>
      </div>
      <div style={{ borderTop: '0.25mm solid #111', paddingTop: '0.8mm' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            columnGap: '1mm',
            rowGap: '0.8mm',
            fontWeight: 700,
            lineHeight: 1.05,
          }}
        >
          {VIPEX_BRANCH_CONTACTS.map((contact) => (
            <div key={contact.route} style={{ minWidth: 0 }}>
              <div style={{ fontSize: '1.6mm', whiteSpace: 'nowrap' }}>{contact.route}:</div>
              <div style={{ fontSize: '1.42mm', whiteSpace: 'nowrap' }}>{contact.phones}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
