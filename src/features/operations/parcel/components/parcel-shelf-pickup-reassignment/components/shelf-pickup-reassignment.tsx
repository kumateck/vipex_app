import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useShelfPickupReassignment } from '../hooks';
import { ShelfPickupReassignmentForm } from './shelf-pickup-reassignment-form';
import { ShelfPickupReassignmentTable } from './shelf-pickup-reassignment-table';

export function ShelfPickupReassignment() {
  const state = useShelfPickupReassignment();
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Reassign Shelf Pickup</CardTitle>
          <CardDescription>
            Find an assigned parcel awaiting pickup and change its shelf picker.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              state.submitSearch();
            }}
          >
            <Input
              aria-label="Search assigned parcels"
              placeholder="Booking, tracking, telephone, or receiver"
              value={state.searchInput}
              onChange={(event) => state.setSearchInput(event.target.value)}
              maxLength={255}
            />
            <Button type="submit" disabled={state.result.isFetching}>
              Search
            </Button>
          </form>
          {state.result.isError ? (
            <p role="alert" className="text-destructive">
              Unable to load assigned parcels.{' '}
              <Button variant="outline" onClick={() => void state.result.refetch()}>
                Retry
              </Button>
            </p>
          ) : null}
          <ShelfPickupReassignmentTable
            rows={state.result.currentData?.data ?? []}
            loading={state.result.isFetching}
            onSelect={state.setSelected}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{state.result.currentData?.meta.totalRecords ?? 0} parcels</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={state.page <= 1 || state.result.isFetching}
                onClick={() => state.setPage(state.page - 1)}
              >
                Previous
              </Button>
              <span className="self-center">Page {state.page}</span>
              <Button
                variant="outline"
                disabled={!state.result.currentData?.meta.hasNextPage || state.result.isFetching}
                onClick={() => state.setPage(state.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {state.selected ? (
        <ShelfPickupReassignmentForm
          key={state.selected.id}
          parcel={state.selected}
          scope={state.scope}
          onDone={state.close}
        />
      ) : null}
    </div>
  );
}
