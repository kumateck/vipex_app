import { ParcelCreditChargeAction } from '@/features/operations/parcel-credit-charge';
import { memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ParcelFullDetails } from '@/features/operations/parcel/api/parcel.api';
import { paymentMethodLabel } from '@/features/operations/parcel/components/parcel-super-search/utils';
import {
  formatMoney,
  formatWhen,
  payerLabel,
  paymentComponentLabel,
  personName,
} from '../../utils/parcel-details-format';
import { DetailCard, DetailGrid, EmptyNote } from '../detail-grid/detail-grid';

export const PaymentsSection = memo(function PaymentsSection({
  details,
}: {
  details: ParcelFullDetails;
}) {
  const { parcel, summary, payments } = details;
  const userNames = details.userNames ?? {};

  return (
    <div className="space-y-4">
      <DetailCard title="Charges">
        <DetailGrid
          items={[
            { label: 'Parcel Charge', value: formatMoney(parcel.chargePsw) },
            {
              label: 'To Be Paid by Receiver (planned)',
              value: formatMoney(parcel.plannedToBePaidPsw),
            },
            { label: 'Planned Payment Method', value: paymentMethodLabel(parcel.method) },
            { label: 'Paid (parcel charge)', value: formatMoney(summary?.paidPrincipalPsw) },
            { label: 'Paid by Sender', value: formatMoney(summary?.senderPaidPrincipalPsw) },
            { label: 'Paid by Receiver', value: formatMoney(summary?.receiverPaidPrincipalPsw) },
            {
              label: 'Outstanding (parcel charge)',
              value: formatMoney(summary?.outstandingPrincipalPsw),
            },
            {
              label: 'Delivery Fee',
              value: formatMoney(summary?.deliveryFeePsw ?? details.delivery?.chargePsw),
            },
            {
              label: 'Outstanding Delivery Fee',
              value: formatMoney(summary?.outstandingDeliveryFeePsw),
            },
          ]}
        />
        {parcel.chargePsw === 0 ? (
          <div className="mt-4">
            <ParcelCreditChargeAction
              key={parcel.id}
              parcelId={parcel.id}
              bookingCode={parcel.bookingCode}
              chargePsw={parcel.chargePsw}
              senderName={parcel.senderNameSnapshot}
            />
          </div>
        ) : null}
      </DetailCard>
      <DetailCard title={`Payment Records (${payments.length})`}>
        {payments.length === 0 ? (
          <EmptyNote>No payments recorded.</EmptyNote>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>For</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead>Voided</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow
                  key={payment.id}
                  className={payment.voidedAt ? 'text-muted-foreground line-through' : undefined}
                >
                  <TableCell>{formatWhen(payment.receivedAt)}</TableCell>
                  <TableCell className="font-medium">
                    {formatMoney(payment.grossAmountPsw)}
                  </TableCell>
                  <TableCell>{paymentComponentLabel(payment.component)}</TableCell>
                  <TableCell>{payerLabel(payment.payer)}</TableCell>
                  <TableCell>{paymentMethodLabel(payment.method)}</TableCell>
                  <TableCell>{payment.receiptNo ?? '-'}</TableCell>
                  <TableCell>{personName(userNames, payment.cashierUserId)}</TableCell>
                  <TableCell className="no-underline">
                    {payment.voidedAt
                      ? `${formatWhen(payment.voidedAt)} by ${personName(userNames, payment.voidedBy)}${payment.voidReason ? ` (${payment.voidReason})` : ''}`
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DetailCard>
    </div>
  );
});
