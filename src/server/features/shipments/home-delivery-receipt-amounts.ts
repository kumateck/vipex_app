export function buildHomeDeliveryReceiptAmounts(input: {
  chargePsw: number;
  plannedToBePaidPsw: number;
  deliveryFeePsw: number;
  paidPrincipalPsw: number;
  paidDeliveryFeePsw: number;
}) {
  const chargePsw = Math.max(input.chargePsw, 0);
  const deliveryFeePsw = Math.max(input.deliveryFeePsw, 0);
  const paidPrincipalPsw = Math.min(Math.max(input.paidPrincipalPsw, 0), chargePsw);
  const paidDeliveryFeePsw = Math.min(Math.max(input.paidDeliveryFeePsw, 0), deliveryFeePsw);
  const principalDuePsw = Math.min(
    Math.max(input.plannedToBePaidPsw, 0),
    chargePsw - paidPrincipalPsw,
  );
  const deliveryFeeDuePsw = deliveryFeePsw - paidDeliveryFeePsw;
  const totalDuePsw = principalDuePsw + deliveryFeeDuePsw;
  return {
    chargePsw,
    deliveryFeePsw,
    paidPrincipalPsw,
    paidDeliveryFeePsw,
    principalDuePsw,
    deliveryFeeDuePsw,
    totalDuePsw,
    grossPsw: totalDuePsw,
  };
}
