type ThermalStickerCashierLineProps = {
  cashierName?: string | null;
  size?: 'portrait' | 'landscape';
};

export function ThermalStickerCashierLine({
  cashierName,
  size = 'portrait',
}: ThermalStickerCashierLineProps) {
  const name = cashierName?.trim();
  if (!name) return null;

  return (
    <div
      style={{
        marginTop: size === 'landscape' ? '1.6mm' : '1.2mm',
        fontSize: size === 'landscape' ? '2.8mm' : '2.3mm',
        fontWeight: 700,
        lineHeight: 1.15,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      Cashier: {name}
    </div>
  );
}
