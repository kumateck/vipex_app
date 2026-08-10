type ThermalStickerWordmarkProps = {
  size?: 'portrait' | 'landscape';
};

export function ThermalStickerWordmark({ size = 'portrait' }: ThermalStickerWordmarkProps) {
  const vipFontSize = size === 'landscape' ? '10mm' : '7.2mm';
  const parcelFontSize = size === 'landscape' ? '5.8mm' : '4.4mm';

  return (
    <div
      aria-label="Vipex Parcel"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'landscape' ? '1.4mm' : '0.9mm',
        fontWeight: 900,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ display: 'inline-flex', fontSize: vipFontSize, lineHeight: 0.82 }}>
        <span>VI</span>
        <span style={{ position: 'relative', display: 'inline-block', paddingRight: '0.18em' }}>
          P
          <span
            style={{
              position: 'absolute',
              top: '61%',
              left: '40%',
              fontSize: '0.34em',
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            EX
          </span>
        </span>
      </span>
      <span style={{ fontSize: parcelFontSize, lineHeight: 1, letterSpacing: '0.02em' }}>
        PARCEL
      </span>
    </div>
  );
}
