import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { CustomerCreditOpenItem, CustomerPayment } from '@/features/customers/api';
import type { ServerListResponse } from '@/services/rtk-query';
import { formatMoney, paymentMethodLabel } from './customer-details.utils';

type CustomerPaymentsTabProps = {
  paymentAmount: string;
  onPaymentAmountChange: (value: string) => void;
  paymentNotes: string;
  onPaymentNotesChange: (value: string) => void;
  onPayDebt: () => Promise<void>;
  isPostingPayment: boolean;
  creditOpenItems: CustomerCreditOpenItem[];
  isLoadingPayments: boolean;
  payments: ServerListResponse<CustomerPayment> | undefined;
  paymentsPage: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function CustomerPaymentsTab({
  paymentAmount,
  onPaymentAmountChange,
  paymentNotes,
  onPaymentNotesChange,
  onPayDebt,
  isPostingPayment,
  creditOpenItems,
  isLoadingPayments,
  payments,
  paymentsPage,
  onPrevPage,
  onNextPage,
}: CustomerPaymentsTabProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>Customer payment records and debt settlement action.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        <div className="grid gap-2 md:grid-cols-3">
          <Input
            placeholder="Amount (GHS)"
            inputMode="decimal"
            value={paymentAmount}
            onChange={(e) => onPaymentAmountChange(e.target.value)}
          />
          <Input
            placeholder="Notes (optional)"
            value={paymentNotes}
            onChange={(e) => onPaymentNotesChange(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void onPayDebt()}
            disabled={isPostingPayment}
          >
            Pay Debt
          </Button>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium">Outstanding Credit Items</p>
          {creditOpenItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No outstanding credit items in selected range.
            </p>
          ) : (
            creditOpenItems.map((item) => (
              <div key={item.chargeTransactionId} className="rounded-md border p-2 text-xs">
                <p className="font-medium">Outstanding: {formatMoney(item.outstandingAmountPsw)}</p>
                <p className="text-muted-foreground">
                  Charged: {formatMoney(item.chargeAmountPsw)} • Allocated:{' '}
                  {formatMoney(item.allocatedAmountPsw)}
                </p>
                <p className="text-muted-foreground">{formatDateTimeShared(item.createdAt)}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          {isLoadingPayments ? <p className="text-xs text-muted-foreground">Loading...</p> : null}
          {(payments?.data ?? []).map((row) => (
            <div key={row.id} className="rounded-md border p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">
                  {row.source === 'CREDIT_PAYMENT' ? 'Credit Payment' : 'Parcel Payment'}
                </p>
                <p className="font-medium">{formatMoney(row.amountPsw)}</p>
              </div>
              <p className="text-muted-foreground">
                {row.trackingCode ? `Tracking: ${row.trackingCode}` : 'No tracking'}{' '}
                {row.method != null ? `• ${paymentMethodLabel(row.method)}` : ''}
              </p>
              <p className="text-muted-foreground">{formatDateTimeShared(row.createdAt)}</p>
            </div>
          ))}

          <div className="flex items-center justify-between border-t pt-2">
            <p className="text-xs text-muted-foreground">
              Page {payments?.meta.page ?? paymentsPage} of {payments?.meta.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onPrevPage}
                disabled={!payments?.meta.hasPreviousPage}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onNextPage}
                disabled={!payments?.meta.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
