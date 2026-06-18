import qrcode from 'qrcode-generator';

export function formatTelephones(primary?: string | null, secondary?: string | null) {
  return [primary, secondary]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(' / ');
}

export function createQrSvg(value: string) {
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();
  return qr
    .createSvgTag({ cellSize: 3, margin: 1, scalable: true })
    .replace('<svg ', '<svg style="width:100%;height:100%;display:block;" ');
}

type StickerRowProps = {
  label: string;
  value?: string | null;
  align?: 'left' | 'center';
  emphasis?: boolean;
  noWrap?: boolean;
};

export function StickerRow({
  label,
  value,
  align = 'left',
  emphasis = false,
  noWrap = false,
}: StickerRowProps) {
  const displayValue = value?.trim() || '-';

  return (
    <div style={{ minWidth: 0, borderTop: '0.35mm solid #111', paddingTop: '0.45mm' }}>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '2.2mm',
            fontWeight: 700,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '0',
            textAlign: align,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: getValueFontSize(displayValue, emphasis),
            lineHeight: 1.04,
            whiteSpace: noWrap ? 'nowrap' : 'normal',
            overflow: 'visible',
            textOverflow: 'clip',
            overflowWrap: 'anywhere',
            textAlign: align,
          }}
        >
          {displayValue}
        </div>
      </div>
    </div>
  );
}

function getValueFontSize(value: string, emphasis: boolean) {
  if (value.length > 54) return emphasis ? '2mm' : '1.9mm';
  if (value.length > 48) return emphasis ? '2.2mm' : '2.05mm';
  if (value.length > 42) return emphasis ? '2.45mm' : '2.25mm';
  if (value.length > 34) return emphasis ? '2.8mm' : '2.55mm';
  if (value.length > 26) return emphasis ? '3.2mm' : '2.9mm';
  if (value.length > 20) return emphasis ? '3.7mm' : '3.3mm';
  return emphasis ? '4.6mm' : '4mm';
}
