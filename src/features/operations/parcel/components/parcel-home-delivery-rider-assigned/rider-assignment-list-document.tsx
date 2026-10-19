import type { RiderAssignmentListPrintPayload } from './use-rider-assignment-list-print';
import { formatRiderListMoney, getRiderAssignmentListTotals } from './rider-assignment-list-utils';

export function RiderAssignmentListDocument({
  payload,
}: {
  payload: RiderAssignmentListPrintPayload;
}) {
  const totals = getRiderAssignmentListTotals(payload.rows);

  return (
    <div className="rider-assignment-list-sheet">
      <h1>Rider Assigned Parcels</h1>
      <div className="rider-assignment-list-meta">
        <span>
          <strong>Rider:</strong> {payload.riderName}
        </span>
        <span>
          <strong>View:</strong>{' '}
          {payload.mode === 'all' ? 'All' : payload.mode === 'current' ? 'Current' : 'History'}
        </span>
        <span>
          <strong>Printed:</strong> {new Date(payload.printedAt).toLocaleString('en-GH')}
        </span>
        <span>
          <strong>Parcels:</strong> {payload.rows.length}
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Booking Code</th>
            <th>Parcel Details</th>
            <th>Receiver / Phone</th>
            <th>Home Address</th>
            <th>To Be Paid</th>
            <th>Delivery Fee</th>
            <th className="rider-assignment-list-check">Delivered</th>
          </tr>
        </thead>
        <tbody>
          {payload.rows.map((row, index) => (
            <tr key={row.deliveryId}>
              <td>{index + 1}</td>
              <td>{row.bookingCode}</td>
              <td>{row.parcelDetails || row.parcelContent || '-'}</td>
              <td>
                {row.receiverName ?? '-'}
                <br />
                {row.receiverPhone ?? '-'}
              </td>
              <td>{row.dropoffAddress?.trim() || '-'}</td>
              <td>{formatRiderListMoney(row.outstandingPrincipalPsw ?? row.plannedToBePaidPsw)}</td>
              <td>{formatRiderListMoney(row.deliveryFeePsw)}</td>
              <td className="rider-assignment-list-check">
                <span className="rider-assignment-list-checkbox" aria-label="Delivered checkbox" />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={5}>Total</th>
            <th>{formatRiderListMoney(totals.principalPsw)}</th>
            <th>{formatRiderListMoney(totals.deliveryFeePsw)}</th>
            <th />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
