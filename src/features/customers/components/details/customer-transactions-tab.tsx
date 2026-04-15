import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CustomerTransaction } from '@/features/customers/api';
import type { ServerListResponse } from '@/services/rtk-query';
import { STATUS_LABELS } from './customer-details.constants';
import { formatMoney } from './customer-details.utils';

type CustomerTransactionsTabProps = {
  isLoadingTransactions: boolean;
  transactions: ServerListResponse<CustomerTransaction> | undefined;
  branchNameById: Map<string, string>;
  txPage: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onViewParcel: (parcelId: string) => void;
};

export function CustomerTransactionsTab({
  isLoadingTransactions,
  transactions,
  branchNameById,
  txPage,
  onPrevPage,
  onNextPage,
  onViewParcel,
}: CustomerTransactionsTabProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Parcel Transactions</CardTitle>
        <CardDescription>
          Records where customer is sender or receiver with current statuses.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        <div className="space-y-2">
          {isLoadingTransactions ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : null}
          {(transactions?.data ?? []).map((row) => (
            <div key={row.id} className="rounded-md border p-2 text-xs">
              <p className="text-muted-foreground">
                {row.transactionRole === 'SENDER' ? 'Source Branch' : 'Destination Branch'}:{' '}
                {branchNameById.get(
                  row.transactionRole === 'SENDER' ? row.sourceId : row.destinationId,
                ) ?? '-'}
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{row.trackingCode}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={row.transactionRole === 'SENDER' ? 'default' : 'secondary'}>
                    {row.transactionRole === 'SENDER' ? 'Sender' : 'Receiver'}
                  </Badge>
                  <Badge variant="outline">
                    {STATUS_LABELS[row.status] ?? `Status ${row.status}`}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground">Booking: {row.bookingCode}</p>
              <p className="text-muted-foreground">Charge: {formatMoney(row.chargePsw)}</p>
              <p className="text-muted-foreground">{formatDateTimeShared(row.createdAt)}</p>
              <div className="mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onViewParcel(row.id)}
                >
                  View details
                </Button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between border-t pt-2">
            <p className="text-xs text-muted-foreground">
              Page {transactions?.meta.page ?? txPage} of {transactions?.meta.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onPrevPage}
                disabled={!transactions?.meta.hasPreviousPage}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onNextPage}
                disabled={!transactions?.meta.hasNextPage}
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
