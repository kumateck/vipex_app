import type { RiderDoorstepRecord } from '../../api/parcel.api';

export const formatRiderListMoney = (amountPsw: number | null | undefined) =>
  `GHS ${((amountPsw ?? 0) / 100).toFixed(2)}`;

export function getRiderAssignmentListTotals(rows: RiderDoorstepRecord[]) {
  return rows.reduce(
    (totals, row) => ({
      principalPsw: totals.principalPsw + (row.outstandingPrincipalPsw ?? row.plannedToBePaidPsw),
      deliveryFeePsw: totals.deliveryFeePsw + row.deliveryFeePsw,
    }),
    { principalPsw: 0, deliveryFeePsw: 0 },
  );
}
