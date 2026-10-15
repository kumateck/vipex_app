import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

function buildQrPath(value: string, size: number, quietZone: number) {
  const qr = qrcode(0, 'Q');
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  const margin = Math.max(4, (quietZone * count) / size);
  const segments: string[] = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) segments.push(`M${col} ${row}h1v1h-1z`);
    }
  }
  return {
    path: segments.join(''),
    viewBox: `${-margin} ${-margin} ${count + margin * 2} ${count + margin * 2}`,
  };
}

export function PrintQrCode({
  value,
  size,
  quietZone,
}: {
  value: string;
  size: number;
  quietZone: number;
}) {
  const qr = useMemo(() => buildQrPath(value, size, quietZone), [value, size, quietZone]);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={qr.viewBox}
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%', background: '#fff' }}
    >
      <rect x="-100%" y="-100%" width="300%" height="300%" fill="#fff" />
      <path d={qr.path} fill="#000" shapeRendering="crispEdges" />
    </svg>
  );
}
