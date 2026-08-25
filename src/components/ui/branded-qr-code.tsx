import type { CSSProperties } from 'react';
import { QRCode } from 'react-qrcode-logo';
import logoPng from '@/assets/logo.png';

type BrandedQrCodeProps = {
  value: string;
  size: number;
  className?: string;
  ariaLabel?: string;
  style?: CSSProperties;
};

export function BrandedQrCode({
  value,
  size,
  className,
  ariaLabel = 'QR code',
  style,
}: BrandedQrCodeProps) {
  const logoSize = Math.round(size * 0.18);
  const logoPadding = Math.max(2, Math.round(size * 0.02));
  const quietZone = Math.max(4, Math.round(size * 0.04));
  const renderedSize = size + quietZone * 2;

  return (
    <div
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={{ width: renderedSize, height: renderedSize, ...style }}
    >
      <QRCode
        value={value}
        size={size}
        quietZone={quietZone}
        ecLevel="H"
        bgColor="#ffffff"
        fgColor="#000000"
        logoImage={logoPng}
        logoWidth={logoSize}
        logoHeight={logoSize}
        logoPadding={logoPadding}
        logoPaddingStyle="square"
        removeQrCodeBehindLogo
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
