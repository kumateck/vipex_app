export function formatTelephones(primary?: string | null, secondary?: string | null) {
  return [primary, secondary]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(' / ');
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
    <div
      style={{
        minWidth: 0,
        borderTop: '0.35mm solid #111',
        padding: emphasis ? '0.45mm 0.8mm' : '0.35mm 0',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: emphasis ? '2.2mm' : '1.9mm',
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
            lineHeight: 0.9,
            whiteSpace: noWrap ? 'nowrap' : 'normal',
            overflow: 'hidden',
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
  if (value.length > 54) return emphasis ? '1.9mm' : '1.8mm';
  if (value.length > 48) return emphasis ? '2.1mm' : '1.95mm';
  if (value.length > 42) return emphasis ? '2.35mm' : '2.15mm';
  if (value.length > 34) return emphasis ? '2.65mm' : '2.4mm';
  if (value.length > 26) return emphasis ? '3mm' : '2.75mm';
  if (value.length > 20) return emphasis ? '3.45mm' : '3.1mm';
  return emphasis ? '4.2mm' : '3.65mm';
}
