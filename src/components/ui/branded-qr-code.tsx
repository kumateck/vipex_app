import type { CSSProperties } from 'react';
import { QRCode } from 'react-qrcode-logo';
import logoPng from '@/assets/logo.png';

type BrandedQrCodeProps = {
  value: string;
  size: number;
  variant?: 'branded' | 'print';
  className?: string;
  ariaLabel?: string;
  style?: CSSProperties;
};

export function BrandedQrCode({
  value,
  size,
  variant = 'branded',
  className,
  ariaLabel = 'QR code',
  style,
}: BrandedQrCodeProps) {
  const isPrintVariant = variant === 'print';
  const logoSize = Math.round(size * 0.18);
  const logoPadding = Math.max(2, Math.round(size * 0.02));
  const quietZone = Math.max(12, Math.round(size * (isPrintVariant ? 0.16 : 0.14)));
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
        ecLevel={isPrintVariant ? 'Q' : 'H'}
        bgColor="#ffffff"
        fgColor="#000000"
        logoImage={isPrintVariant ? undefined : logoPng}
        logoWidth={logoSize}
        logoHeight={logoSize}
        logoPadding={logoPadding}
        logoPaddingStyle="square"
        removeQrCodeBehindLogo={!isPrintVariant}
        style={{ display: 'block', width: '100%', height: '100%', imageRendering: 'pixelated' }}
      />
    </div>
  );
}
