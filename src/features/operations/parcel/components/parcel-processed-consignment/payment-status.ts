export type PaymentStatusParcel = {
  chargePsw: number;
  plannedToBePaidPsw: number;
};

export const CONSIGNMENT_PAYMENT_STATUS_LEGEND = [
  { label: 'Paid', dotClassName: 'bg-emerald-500' },
  { label: 'To Be Paid', dotClassName: 'bg-amber-500' },
  { label: 'Partial', dotClassName: 'bg-sky-500' },
];

export function getConsignmentPaymentStatus(parcel: PaymentStatusParcel) {
  const charge = Number(parcel.chargePsw ?? 0);
  const receiverDue = Math.max(Number(parcel.plannedToBePaidPsw ?? 0), 0);

  if (receiverDue <= 0) {
    return { dotClassName: 'bg-emerald-500' };
  }

  if (receiverDue >= charge) {
    return { dotClassName: 'bg-amber-500' };
  }

  return { dotClassName: 'bg-sky-500' };
}
