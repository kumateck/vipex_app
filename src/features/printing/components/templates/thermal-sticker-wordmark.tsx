type ThermalStickerWordmarkProps = {
  size?: 'portrait' | 'landscape';
};

export function ThermalStickerWordmark({ size = 'portrait' }: ThermalStickerWordmarkProps) {
  const fontSize = size === 'landscape' ? '8mm' : '5.8mm';

  return (
    <div
      aria-label="Vipex"
      style={{
        display: 'inline-flex',
        alignItems: 'flex-start',
        fontSize,
        fontWeight: 900,
        lineHeight: 0.82,
        whiteSpace: 'nowrap',
      }}
    >
      <span>VI</span>
      <span style={{ position: 'relative', display: 'inline-block', paddingRight: '0.72em' }}>
        P
        <span
          style={{
            position: 'absolute',
            top: '58%',
            left: '68%',
            fontSize: '0.42em',
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          EX
        </span>
      </span>
    </div>
  );
}
