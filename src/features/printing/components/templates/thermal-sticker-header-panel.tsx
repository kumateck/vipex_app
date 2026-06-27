import logoPng from '@/assets/logo.png';
import { VIPEX_BRANCH_CONTACTS } from './thermal-sticker-contacts';

type ThermalStickerHeaderPanelProps = {
  issuedAtLabel: string;
  printedByName?: string | null;
  printedByBranchName?: string | null;
  printedByLocationName?: string | null;
};

export function ThermalStickerHeaderPanel({
  issuedAtLabel,
  printedByName,
  printedByBranchName,
  printedByLocationName,
}: ThermalStickerHeaderPanelProps) {
  const printerLocation = [printedByBranchName, printedByLocationName]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(' / ');

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
      <div style={{ borderTop: '0.25mm solid #111', paddingTop: '1mm' }}>
        <div style={{ fontSize: '2.4mm', fontWeight: 700, textTransform: 'uppercase' }}>
          Printed
        </div>
        <div style={{ fontSize: '3mm', fontWeight: 700, lineHeight: 1.15 }}>{issuedAtLabel}</div>
        <div style={{ marginTop: '1mm', fontSize: '2.35mm', lineHeight: 1.15 }}>
          <span style={{ fontWeight: 700 }}>By:</span> {printedByName?.trim() || '-'}
        </div>
        <div style={{ marginTop: '0.3mm', fontSize: '2.25mm', lineHeight: 1.15 }}>
          {printerLocation || '-'}
        </div>
        <div style={{ marginTop: '1mm', fontSize: '2.25mm', lineHeight: 1.16 }}>
          {VIPEX_BRANCH_CONTACTS}
        </div>
      </div>
    </section>
  );
}
