import { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { isReceiverCashierSignature } from '@/shared/shipments/receiver-cashier-signature';
import type { useWebBatchHandover } from '../../hooks/web';
import { useBatchTopazSignature } from '../../hooks/web';
import { BatchMobileSignature } from './batch-mobile-signature';

const SignaturePad = lazy(() =>
  import('@/components/ui/handover-signature-pad').then(({ HandoverSignaturePad }) => ({
    default: HandoverSignaturePad,
  })),
);

export function BatchSignature({
  flow,
  allowTopaz,
}: {
  flow: ReturnType<typeof useWebBatchHandover>;
  allowTopaz: boolean;
}) {
  const topaz = useBatchTopazSignature(flow.setSignature);
  const signed = flow.signature && isReceiverCashierSignature(flow.signature);
  const disabled =
    flow.busy || topaz.busy || flow.mobileSignature.busy || flow.mobileSignature.checking;

  if (flow.mobileSignature.status) return <BatchMobileSignature flow={flow} />;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Receiver signature for all selected parcels</p>
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => void flow.mobileSignature.request()}
      >
        Request signature on mobile
      </Button>
      {flow.mobileSignature.error ? (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{flow.mobileSignature.error}</p>
          <Button variant="outline" onClick={flow.mobileSignature.retry}>
            Retry signature check
          </Button>
        </div>
      ) : null}
      {flow.signature?.source === 'topaz' ? (
        <div className="space-y-2">
          <img
            src={flow.signature.signatureImage}
            alt="Captured receiver signature"
            className="max-h-32 rounded-md border bg-white"
          />
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => flow.setSignature(undefined)}
          >
            Clear signature
          </Button>
        </div>
      ) : (
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading signature pad…</p>}
        >
          <SignaturePad
            disabled={disabled}
            onChange={(signatureImage) =>
              flow.setSignature(
                signatureImage ? { source: 'touchscreen', signatureImage } : undefined,
              )
            }
          />
        </Suspense>
      )}
      {allowTopaz && topaz.available ? (
        <Button variant="outline" disabled={disabled} onClick={() => void topaz.capture()}>
          Sign on Topaz
        </Button>
      ) : null}
      {topaz.error ? (
        <p role="alert" className="text-sm text-destructive">
          {topaz.error}
        </p>
      ) : null}
      {flow.signature && !signed ? (
        <p role="alert" className="text-sm text-destructive">
          Clear the signature and sign again.
        </p>
      ) : null}
      <Button disabled={disabled || !signed} onClick={() => void flow.confirm()}>
        {flow.totalPsw > 0 ? 'Confirm payment and hand over' : 'Confirm received'} ·{' '}
        {flow.selected.length} parcels
      </Button>
    </div>
  );
}
