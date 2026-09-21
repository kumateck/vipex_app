import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useGetMomoTransactionStatusQuery,
  useInitiateMomoRequestToPayMutation,
} from '../api/momo.api';

const MOMO_SUCCESSFUL = 1;
const MOMO_TERMINAL_FAILURE_STATUSES = new Set([2, 3, 4]); // FAILED, TIMED_OUT, CANCELLED

type MomoRequestToPayPanelProps = {
  parcelId: string;
  flow: 'sender' | 'receiver';
  amountCedis: number;
  onConfirmed: (momoTransactionId: string) => void;
  disabled?: boolean;
};

export function MomoRequestToPayPanel({
  parcelId,
  flow,
  amountCedis,
  onConfirmed,
  disabled,
}: MomoRequestToPayPanelProps) {
  const [momoNumber, setMomoNumber] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [initiate, { isLoading: isInitiating }] = useInitiateMomoRequestToPayMutation();
  const { data: statusData } = useGetMomoTransactionStatusQuery(
    { id: transactionId ?? '' },
    { skip: !transactionId || confirmed, pollingInterval: 3000 },
  );

  useEffect(() => {
    if (!statusData || !transactionId || confirmed) return;
    if (statusData.status === MOMO_SUCCESSFUL) {
      setConfirmed(true);
      onConfirmed(transactionId);
      toast.success('MoMo payment confirmed');
    } else if (MOMO_TERMINAL_FAILURE_STATUSES.has(statusData.status)) {
      toast.error(
        statusData.statusReason ||
          'MoMo payment failed or timed out. Retry or use another payment method.',
      );
      setTransactionId(null);
    }
  }, [statusData, transactionId, confirmed, onConfirmed]);

  const handleRequest = async () => {
    try {
      const result = await initiate({ parcelId, flow, momoNumber, amountCedis }).unwrap();
      setTransactionId(result.id);
      toast.success('Payment request sent. Ask the customer to approve on their phone.');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to initiate MoMo payment');
    }
  };

  if (confirmed) {
    return (
      <div className="rounded-md border border-green-600 p-3 text-sm text-green-700">
        MoMo payment of GHS {amountCedis.toFixed(2)} confirmed.
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label htmlFor="momo-number">Customer MoMo Number</Label>
      <div className="flex items-center gap-2">
        <Input
          id="momo-number"
          value={momoNumber}
          onChange={(event) => setMomoNumber(event.target.value.replace(/\D/g, '').slice(0, 15))}
          placeholder="0240000000"
          inputMode="numeric"
          disabled={Boolean(transactionId) || disabled}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => void handleRequest()}
          disabled={isInitiating || Boolean(transactionId) || momoNumber.length < 9 || disabled}
        >
          {isInitiating ? 'Sending...' : 'Request Payment'}
        </Button>
      </div>
      {transactionId ? (
        <p className="text-xs text-muted-foreground">
          Waiting for the customer to approve on their phone...
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          GHS {amountCedis.toFixed(2)} will be requested via MTN MoMo.
        </p>
      )}
    </div>
  );
}
