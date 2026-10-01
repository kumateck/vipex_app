export function ThermalStickerCallSenderMark() {
  return (
    <span
      title="Call sender before handing parcel to receiver"
      style={{
        position: 'absolute',
        top: '0.4mm',
        right: '0.6mm',
        border: '0.4mm solid #111',
        padding: '0.1mm 0.6mm',
        backgroundColor: '#fff',
        color: '#000',
        fontSize: '3.2mm',
        fontWeight: 900,
        lineHeight: 1,
      }}
    >
      CS
    </span>
  );
}
