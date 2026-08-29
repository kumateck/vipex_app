import { useParams } from 'react-router-dom';
import { BrandedQrCode } from '@/components/ui/branded-qr-code';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import logoPng from '@/assets/logo.png';
import { useGetBranchQuery } from '../api/branches.api';
import { buildSelfServiceUrl } from '../utils/self-service-url';

const QR_SIZE = 280;

export function BranchSelfServiceQrPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: branch, isLoading, isError } = useGetBranchQuery(id, { skip: !id });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError || !branch) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Branch not found.</p>;
  }

  const selfServiceUrl = buildSelfServiceUrl({
    branchId: branch.id,
    currentOrigin: window.location.origin,
    developmentHost: __DEV_LAN_HOST__,
    isDevelopment: import.meta.env.DEV,
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #self-service-qr-print, #self-service-qr-print * { visibility: visible; }
            #self-service-qr-print {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
            }
            #self-service-qr-print-actions { display: none; }
          }
        `}
      </style>

      <div id="self-service-qr-print-actions" className="flex justify-end">
        <Button onClick={() => window.print()}>Print</Button>
      </div>

      <Card id="self-service-qr-print">
        <CardContent className="flex flex-col items-center gap-4 bg-white py-10 text-center text-black">
          <img src={logoPng} alt="Vipex logo" className="h-10 w-10 object-contain" />
          <div>
            <p className="text-sm font-medium text-neutral-500">Self-Service Parcel Booking</p>
            <h1 className="text-xl font-semibold">{branch.name}</h1>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <BrandedQrCode
              value={selfServiceUrl}
              size={QR_SIZE}
              ariaLabel={`${branch.name} self-service booking QR code`}
            />
          </div>
          <p className="max-w-xs text-sm text-neutral-600">
            Scan this code to start a parcel booking for {branch.name}. Fill in your details, and a
            staff member will contact you to complete your booking.
          </p>
          <p className="break-all text-xs text-neutral-400">{selfServiceUrl}</p>
        </CardContent>
      </Card>
    </div>
  );
}
