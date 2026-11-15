import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OtpChannelToggle } from '@/features/operations/parcel/components/otp-channel-toggle';
import {
  BATCH_PAYMENT_METHODS,
  type BatchOtpSession,
  type BatchPaymentMethod,
} from '@/shared/shipments/parcel-batch-handover';
import { useBatchOtpResend, type useBatchHandover } from '../../hooks';
import { formatBatchAmount } from '../../utils';
import { BatchSignature } from './batch-signature';

export function BatchVerification({
  flow,
  session,
  allowTopaz,
}: {
  flow: ReturnType<typeof useBatchHandover>;
  session: BatchOtpSession;
  allowTopaz: boolean;
}) {
  const seconds = useBatchOtpResend(session.resendAt);
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">{flow.selected.length} selected parcels</p>
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          {flow.selected.map((parcel) => (
            <li key={parcel.id}>{parcel.trackingCode}</li>
          ))}
        </ul>
        {flow.totalPsw > 0 ? (
          <p className="text-sm font-medium">Amount due {formatBatchAmount(flow.totalPsw)}</p>
        ) : null}
      </div>

      {flow.proof ? (
        <>
          <p role="status" className="text-sm">
            OTP verified for {flow.telephone}.
          </p>
          {flow.totalPsw > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="batch-payment-method">Payment method</Label>
              <Select
                value={flow.paymentMethod}
                onValueChange={(value) => flow.setPaymentMethod(value as BatchPaymentMethod)}
                disabled={flow.busy}
              >
                <SelectTrigger id="batch-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_PAYMENT_METHODS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <BatchSignature flow={flow} allowTopaz={allowTopaz} />
        </>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void flow.verifyOtp();
          }}
        >
          <Label htmlFor="batch-otp">Six-digit OTP sent to {flow.telephone}</Label>
          <div className="flex gap-2">
            <Input
              id="batch-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={flow.otp}
              disabled={flow.busy}
              onChange={(event) => flow.setOtp(event.target.value.replace(/\D/g, ''))}
            />
            <Button type="submit" disabled={flow.busy || flow.otp.length !== 6}>
              Verify OTP
            </Button>
          </div>
        </form>
      )}

      <OtpChannelToggle
        value={flow.channel}
        onChange={flow.setChannel}
        disabled={flow.busy || seconds > 0}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={flow.busy || seconds > 0}
          onClick={() => void flow.sendOtp()}
        >
          {seconds > 0 ? `Resend in ${seconds}s` : 'Send new OTP'}
        </Button>
        <Button type="button" variant="outline" disabled={flow.busy} onClick={flow.changeSelection}>
          Change selection
        </Button>
      </div>
    </div>
  );
}
