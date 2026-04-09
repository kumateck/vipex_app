import { useAuthStore } from '@/stores/auth-store';
import { useGetStockReservationExceptionsSummaryQuery } from '@/features/inventory/api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StockReservationExceptionsPage() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useGetStockReservationExceptionsSummaryQuery(
    { companyId: user?.company?.id ?? '' },
    { skip: !user?.company?.id },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Reservation Exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading summary...</p>
            ) : data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p>
                  <strong>Open Reservations:</strong> {data.openCount}
                </p>
                <p>
                  <strong>Short Reservations:</strong> {data.shortCount}
                </p>
                <p>
                  <strong>Total Short Quantity:</strong> {data.shortQty}
                </p>
                <p>
                  <strong>Pending Quantity:</strong> {data.pendingQty}
                </p>
              </div>
            ) : (
              <p>No exception data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
