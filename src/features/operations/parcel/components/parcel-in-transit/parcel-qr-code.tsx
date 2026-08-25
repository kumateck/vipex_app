import { BrandedQrCode } from '@/components/ui/branded-qr-code';
import { buildParcelTrackingUrl } from '../../utils/tracking-url';

type ParcelQrCodeProps = {
  bookingCode: string;
  trackingCode: string;
};

export function ParcelQrCode({ bookingCode, trackingCode }: ParcelQrCodeProps) {
  return (
    <section className="mb-5 flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-4 text-center">
      <BrandedQrCode
        value={buildParcelTrackingUrl(trackingCode)}
        size={200}
        ariaLabel={`Parcel ${bookingCode} tracking QR code`}
      />
      <div>
        <p className="font-semibold">Parcel QR Code</p>
        <p className="break-all text-xs text-muted-foreground">Tracking: {trackingCode}</p>
      </div>
    </section>
  );
}
