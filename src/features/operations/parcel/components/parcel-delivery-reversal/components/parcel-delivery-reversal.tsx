import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/dates';
import { ParcelStatus } from '@/db/schemas/enums';
import { useParcelDeliveryReversal } from '../hooks/use-parcel-delivery-reversal';
import { ReverseDeliveryDialog } from '../dialogs/reverse-delivery-dialog';

export function ParcelDeliveryReversal() {
  const state = useParcelDeliveryReversal();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reverse Delivery Confirmation</CardTitle>
        <CardDescription>
          Unconfirm a parcel mistakenly marked as delivered to a customer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            state.submitSearch();
          }}
        >
          <Input
            aria-label="Search parcels"
            placeholder="Search by tracking, booking, sender or receiver"
            value={state.searchInput}
            onChange={(event) => state.setSearchInput(event.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Booking</th>
                <th className="p-3">Sender</th>
                <th className="p-3">Receiver</th>
                <th className="p-3">Status</th>
                <th className="p-3">Confirmed D&amp;T</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">
                    {row.bookingCode}
                    <div className="text-muted-foreground">{row.trackingCode}</div>
                  </td>
                  <td className="p-3">{row.senderName ?? '—'}</td>
                  <td className="p-3">{row.receiverName ?? '—'}</td>
                  <td className="p-3">
                    {row.status === ParcelStatus.DELIVERED_BY_OFFICE
                      ? 'Delivered by Office'
                      : 'Delivered at Home'}
                  </td>
                  <td className="p-3">
                    {row.confirmedAt ? formatDateTime(new Date(row.confirmedAt)) : '—'}
                  </td>
                  <td className="p-3">
                    <Button variant="outline" size="sm" onClick={() => state.setSelectedId(row.id)}>
                      Reverse
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!state.rows.length && (
            <p className="p-6 text-center text-muted-foreground">
              {state.isLoading ? 'Loading…' : 'No delivered parcels found.'}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{state.meta?.totalRecords ?? 0} parcels</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={state.page <= 1}
              onClick={() => state.setPage(state.page - 1)}
            >
              Previous
            </Button>
            <span>Page {state.page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!state.meta?.hasNextPage}
              onClick={() => state.setPage(state.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
      <ReverseDeliveryDialog
        open={Boolean(state.selectedId)}
        onOpenChange={(open) => {
          if (!open) {
            state.setSelectedId(null);
            state.setReason('');
          }
        }}
        reason={state.reason}
        onReasonChange={state.setReason}
        onConfirm={state.confirm}
        isSaving={state.isSaving}
      />
    </Card>
  );
}
