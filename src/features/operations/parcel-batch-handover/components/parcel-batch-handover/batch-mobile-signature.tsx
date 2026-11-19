import { Button } from '@/components/ui/button';
import type { useWebBatchHandover } from '../../hooks/web';

export function BatchMobileSignature({ flow }: { flow: ReturnType<typeof useWebBatchHandover> }) {
  const mobile = flow.mobileSignature;
  const status = mobile.status!;
  const disabled = flow.busy || mobile.busy;
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p role="status" className="text-sm">
        {status.signedAt
          ? `Signature received for ${status.parcels.length} parcels. Confirm when the receiver has them.`
          : `Waiting for one signature for ${status.parcels.length} parcels in mobile Operations → Receiver Signatures.`}
      </p>
      {status.signature ? (
        <img
          src={status.signature.signatureImage}
          alt="Receiver signature for the selected parcels"
          className="max-h-32 rounded-md border bg-white"
        />
      ) : null}
      {mobile.error ? (
        <div role="alert" className="text-sm text-destructive">
          <p>{mobile.error}</p>
          <Button variant="outline" onClick={mobile.retry}>
            Retry signature check
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={disabled || !status.signedAt || Boolean(mobile.error)}
          onClick={() => void mobile.confirm()}
        >
          {flow.totalPsw > 0 ? 'Confirm payment and hand over' : 'Confirm received'} ·{' '}
          {status.parcels.length} parcels
        </Button>
        <Button variant="outline" disabled={disabled} onClick={() => void mobile.cancel()}>
          Sign here instead
        </Button>
      </div>
    </div>
  );
}
