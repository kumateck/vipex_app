import {
  portraitDestinationFontSize,
  portraitLocationFontSize,
} from './thermal-sticker-font-size.utils';

export function DestinationRow({
  branch,
  location,
}: {
  branch?: string | null;
  location?: string | null;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        borderTop: '0.35mm solid #111',
        padding: '0.5mm 0 0.6mm',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 0.75fr',
          gap: '1.2mm',
          alignItems: 'start',
          minWidth: 0,
        }}
      >
        <StickerRowContent label="Destination" value={branch} scale="large" />
        <StickerRowContent label="Location" value={location} />
      </div>
    </div>
  );
}

function StickerRowContent({
  label,
  value,
  scale = 'normal',
}: {
  label: string;
  value?: string | null;
  scale?: 'normal' | 'large';
}) {
  const displayValue = value?.trim() || '-';
  const fontSize =
    scale === 'large'
      ? portraitDestinationFontSize(displayValue)
      : portraitLocationFontSize(displayValue);

  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: '2mm',
          fontWeight: 700,
          lineHeight: 1.15,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize,
          fontWeight: 800,
          lineHeight: scale === 'large' ? 1 : 1.1,
          overflowWrap: 'anywhere',
        }}
      >
        {displayValue}
      </div>
    </div>
  );
}
