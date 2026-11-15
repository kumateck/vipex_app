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
import { MAX_BATCH_PARCELS } from '@/shared/shipments/parcel-batch-handover';
import type { useBatchHandover } from '../../hooks';
import { formatBatchAmount } from '../../utils';
import { BatchParcelList } from './batch-parcel-list';

export function BatchParcelSelection({ flow }: { flow: ReturnType<typeof useBatchHandover> }) {
  return (
    <>
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void flow.search();
        }}
      >
        <Label htmlFor="batch-telephone">Receiver telephone</Label>
        <div className="flex gap-2">
          <Input
            id="batch-telephone"
            type="tel"
            autoComplete="off"
            value={flow.draft}
            maxLength={40}
            disabled={flow.busy}
            onChange={(event) => flow.setDraft(event.target.value)}
          />
          <Button type="submit" disabled={flow.busy || !flow.draft.trim()}>
            Find parcels
          </Button>
        </div>
      </form>
      <BatchParcelList flow={flow} />
      {flow.page?.rows.length ? (
        <div className="space-y-3 border-t pt-3">
          <p className="text-sm">
            {flow.selected.length} selected · Choose 2–{MAX_BATCH_PARCELS} parcels
            {flow.totalPsw > 0 ? ` · Amount due ${formatBatchAmount(flow.totalPsw)}` : ''}
          </p>
          {flow.needsAssociate ? (
            <div className="space-y-2">
              <Label htmlFor="batch-associate">Parcel associate for unassigned parcels</Label>
              <Select
                value={flow.associateId}
                onValueChange={flow.setAssociateId}
                disabled={flow.busy}
              >
                <SelectTrigger id="batch-associate">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {flow.page.staff.map(({ id, name }) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!flow.page.staff.length ? (
                <p className="text-sm text-destructive">
                  No active staff available for this selection.
                </p>
              ) : null}
            </div>
          ) : null}
          {flow.selected.length >= 2 ? (
            <OtpChannelToggle
              value={flow.channel}
              onChange={flow.setChannel}
              disabled={flow.busy}
            />
          ) : null}
          <Button disabled={flow.busy || !flow.readyToSend} onClick={() => void flow.sendOtp()}>
            Send one OTP
          </Button>
        </div>
      ) : null}
    </>
  );
}
