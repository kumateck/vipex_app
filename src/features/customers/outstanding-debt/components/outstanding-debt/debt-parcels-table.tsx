import { formatDateTimeTZ } from '@/lib/dates';
import type { OutstandingDebtParcel } from '@/shared/customers/outstanding-debt';
import { formatDebtMoney } from '../../utils';

export function DebtParcelsTable({
  parcels,
  onViewParcel,
}: {
  parcels: readonly OutstandingDebtParcel[];
  onViewParcel?: (parcelId: string) => void;
}) {
  if (!parcels.length) {
    return <p className="text-sm text-muted-foreground">No outstanding parcel balances.</p>;
  }

  return (
    <table className="debt-parcels w-full border-collapse text-left text-sm">
      <caption className="sr-only">Outstanding parcels, oldest first</caption>
      <thead className="bg-muted text-muted-foreground">
        <tr>
          <th scope="col" className="px-3 py-2 font-medium">
            Parcel created (GMT)
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            Booking / tracking
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            Parcel information
          </th>
          <th scope="col" className="px-3 py-2 text-right font-medium">
            Outstanding
          </th>
        </tr>
      </thead>
      <tbody>
        {parcels.map((parcel) => (
          <tr key={parcel.parcelId} className="border-b align-top">
            <td className="px-3 py-2">{formatDateTimeTZ(parcel.createdAt)}</td>
            <td className="px-3 py-2">
              {onViewParcel ? (
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  onClick={() => onViewParcel(parcel.parcelId)}
                  aria-label={`View parcel ${parcel.bookingCode}`}
                >
                  {parcel.bookingCode}
                </button>
              ) : (
                <strong>{parcel.bookingCode}</strong>
              )}
              <div className="text-muted-foreground">{parcel.trackingCode}</div>
            </td>
            <td className="px-3 py-2">
              <div>{parcel.parcelDetails}</div>
              <div className="text-muted-foreground">{parcel.parcelContent}</div>
            </td>
            <td className="px-3 py-2 text-right font-medium tabular-nums">
              {formatDebtMoney(parcel.outstandingAmountPsw)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
