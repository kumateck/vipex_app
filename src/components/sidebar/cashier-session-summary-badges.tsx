import { Badge } from '@/components/ui/badge';

type SummaryMode = 'sender' | 'receiver' | 'delivery' | 'full';

type SessionSummary = {
  amountPaidPsw: number;
  toBePaidPsw: number;
  totalCreditCreatedPsw: number;
  totalDeliveryFeeCollectedPsw: number;
  totalToBePaidCollectedPsw: number;
};

function formatCedisFromPsw(valuePsw: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valuePsw / 100);
}

export function CashierSessionSummaryBadges({
  mode,
  summary,
}: {
  mode: SummaryMode;
  summary?: SessionSummary | null;
}) {
  if (mode === 'receiver') {
    return (
      <Badge variant="secondary">
        Receiver Payments: {formatCedisFromPsw(summary?.totalToBePaidCollectedPsw ?? 0)}
      </Badge>
    );
  }

  if (mode === 'delivery') {
    return (
      <>
        <Badge variant="secondary">
          Delivery Fee: {formatCedisFromPsw(summary?.totalDeliveryFeeCollectedPsw ?? 0)}
        </Badge>
        <Badge variant="outline">
          Receiver Payments: {formatCedisFromPsw(summary?.totalToBePaidCollectedPsw ?? 0)}
        </Badge>
      </>
    );
  }

  return (
    <>
      <Badge variant="secondary">
        Amount Paid: {formatCedisFromPsw(summary?.amountPaidPsw ?? 0)}
      </Badge>
      <Badge variant="outline">To Be Paid: {formatCedisFromPsw(summary?.toBePaidPsw ?? 0)}</Badge>
      <Badge variant="outline">
        Total Credit: {formatCedisFromPsw(summary?.totalCreditCreatedPsw ?? 0)}
      </Badge>
      {mode === 'full' ? (
        <Badge variant="outline">
          Receiver Payments: {formatCedisFromPsw(summary?.totalToBePaidCollectedPsw ?? 0)}
        </Badge>
      ) : null}
    </>
  );
}
