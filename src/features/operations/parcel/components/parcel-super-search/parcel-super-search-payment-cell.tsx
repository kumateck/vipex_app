import { getConsignmentPaymentStatus } from '../parcel-processed-consignment/payment-status';
import { Badge } from '@/components/ui/badge';
import { deliveredPrincipalPayers, formatCurrency } from './utils';

type SuperSearchPayment = {
  parcelValuePsw: number;
  chargePsw: number;
  paidPrincipalPsw?: number;
  plannedToBePaidPsw: number;
  status: number;
  senderPaidPrincipalPsw?: number;
  receiverPaidPrincipalPsw?: number;
};

export function ParcelSuperSearchPaymentCell({ parcel }: { parcel: SuperSearchPayment }) {
  const chargePsw = Math.max(Number(parcel.chargePsw ?? 0), 0);
  const toBePaidPsw = Math.max(Number(parcel.plannedToBePaidPsw ?? 0), 0);
  const paidPsw = Math.max(
    Number(parcel.paidPrincipalPsw ?? Math.max(chargePsw - toBePaidPsw, 0)),
    0,
  );
  const isPaid = toBePaidPsw <= 0;
  const isToBePaid = !isPaid && toBePaidPsw >= chargePsw;
  const paymentStatus = getConsignmentPaymentStatus(parcel);
  const paidBy = deliveredPrincipalPayers(parcel);

  return (
    <div className="space-y-1 text-xs">
      <p className="flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${paymentStatus.dotClassName}`} />
        <span className="text-muted-foreground">Value:</span>{' '}
        {formatCurrency(parcel.parcelValuePsw)}
      </p>
      {!isToBePaid ? (
        <p>
          <span className="text-muted-foreground">Paid:</span> {formatCurrency(paidPsw)}
        </p>
      ) : null}
      {!isPaid ? (
        <p>
          <span className="text-muted-foreground">To be paid:</span> {formatCurrency(toBePaidPsw)}
        </p>
      ) : null}
      {paidBy !== null ? (
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Paid by:</span>
          {paidBy.length === 0 ? <span>-</span> : null}
          {paidBy.includes('S') ? (
            <Badge
              className="bg-blue-600 text-white hover:bg-blue-600"
              title="Sender paid"
              aria-label="Sender paid"
            >
              S
            </Badge>
          ) : null}
          {paidBy.includes('R') ? (
            <Badge
              className="bg-red-600 text-white hover:bg-red-600"
              title="Receiver paid"
              aria-label="Receiver paid"
            >
              R
            </Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
