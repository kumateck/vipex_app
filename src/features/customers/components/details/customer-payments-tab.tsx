import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerDebtSettlement } from '@/features/customers/credit-settlement';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { CustomerPayment } from '@/features/customers/api';
import type { ServerListResponse } from '@/services/rtk-query';
import { formatMoney, paymentMethodLabel } from './customer-details.utils';

type CustomerPaymentsTabProps = {
  customerId: string;
  isLoadingPayments: boolean;
  payments: ServerListResponse<CustomerPayment> | undefined;
  paymentsPage: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function CustomerPaymentsTab({
  customerId,
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
        <PermissionGuard permissionKey={PermissionKeys.CanUpdateCustomers}>
          <CustomerDebtSettlement key={customerId} customerId={customerId} channel="crm" />
        </PermissionGuard>

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
                {row.bookingCode ? `Booking: ${row.bookingCode}` : 'No booking code'}{' '}
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
