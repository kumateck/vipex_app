import { getConsignmentPaymentStatus } from '../parcel-processed-consignment/payment-status';

type AssignmentPayment = {
  chargePsw: number;
  paidPrincipalPsw?: number;
  plannedToBePaidPsw: number;
};

const formatCurrency = (amountPsw: number) => `GHS ${(amountPsw / 100).toFixed(2)}`;

export function CallCenterAssignmentPaymentCell({ parcel }: { parcel: AssignmentPayment }) {
  const chargePsw = Math.max(Number(parcel.chargePsw ?? 0), 0);
  const duePsw = Math.max(Number(parcel.plannedToBePaidPsw ?? 0), 0);
  const paidPsw = Math.max(Number(parcel.paidPrincipalPsw ?? Math.max(chargePsw - duePsw, 0)), 0);
  const isPaid = duePsw <= 0;
  const isToBePaid = !isPaid && duePsw >= chargePsw;
  const status = getConsignmentPaymentStatus(parcel);

  return (
    <div className="space-y-1 text-xs">
      <p className="flex items-center gap-1.5 font-medium">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.dotClassName}`} />
        {isPaid ? 'Paid' : isToBePaid ? 'To Be Paid' : 'Partial'}
      </p>
      {!isToBePaid ? <p>Paid: {formatCurrency(paidPsw)}</p> : null}
      {!isPaid ? <p>To be paid: {formatCurrency(duePsw)}</p> : null}
    </div>
  );
}
