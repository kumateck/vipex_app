import { getConsignmentPaymentStatus } from '../parcel-processed-consignment/payment-status';
import { formatCurrency } from './utils';

type SuperSearchPayment = {
  parcelValuePsw: number;
  chargePsw: number;
  paidPrincipalPsw?: number;
  plannedToBePaidPsw: number;
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
    </div>
  );
}
