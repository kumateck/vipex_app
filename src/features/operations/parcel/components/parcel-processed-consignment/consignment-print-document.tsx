import type { ProcessedParcel } from '../../api/parcel.api';

export type ConsignmentPrintPayload = {
  consignmentCode: string;
  items: ProcessedParcel[];
};

type ConsignmentPrintDocumentProps = {
  payload: ConsignmentPrintPayload | null;
};

function formatMoney(amountPsw?: number | null) {
  const amount = Number(amountPsw ?? 0) / 100;
  return amount.toLocaleString('en-GH', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function getPaidAmountPsw(parcel: ProcessedParcel) {
  return Math.max(Number(parcel.chargePsw ?? 0) - Number(parcel.plannedToBePaidPsw ?? 0), 0);
}

export function ConsignmentPrintDocument({ payload }: ConsignmentPrintDocumentProps) {
  if (!payload) return null;

  return (
    <div className="consignment-print-sheet">
      <h1>Consignment No: {payload.consignmentCode}</h1>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Sender Name</th>
            <th>Telephone</th>
            <th>Receiver Name</th>
            <th>Telephone</th>
            <th>Parcel Details</th>
            <th>Paid</th>
            <th>Tobe Paid</th>
          </tr>
        </thead>
        <tbody>
          {payload.items.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.senderName ?? '-'}</td>
              <td>{item.senderPhone ?? '-'}</td>
              <td>{item.receiverName ?? '-'}</td>
              <td>{item.receiverPhone ?? '-'}</td>
              <td>{item.parcelDetails ?? '-'}</td>
              <td>{formatMoney(getPaidAmountPsw(item))}</td>
              <td>{formatMoney(item.plannedToBePaidPsw)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
