import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { ParcelSecondReceiverDialog } from '../../../dialogs';
import { EMPTY_META } from '../../../home-delivery-pickup/utils';
import { useCashierSecondReceivers, useCashierSecondReceiverColumns } from '../../hooks';

export function DeliveryCashierSecondReceivers() {
  const state = useCashierSecondReceivers();
  const columns = useCashierSecondReceiverColumns(state.secondReceiver);
  if (!state.secondReceiver.canManage) return null;
  return (
    <ScrollableWrapper>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming handovers: second receivers</CardTitle>
          <CardDescription>
            Add a second receiver before the rider completes delivery. The rider can select this
            person on mobile after refreshing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              state.submitSearch();
            }}
          >
            <Input
              aria-label="Search upcoming handovers"
              value={state.search}
              onChange={(event) => state.setSearch(event.target.value)}
              placeholder="Search booking, tracking, sender or receiver name/phone"
            />
            <Button type="submit">Search</Button>
          </form>
          {state.list.isError ? (
            <p role="alert">
              Could not load upcoming handovers.{' '}
              <Button variant="outline" onClick={() => void state.list.refetch()}>
                Retry
              </Button>
            </p>
          ) : null}
          <DataTable
            className="[&_table]:min-w-7xl [&_td]:align-top"
            mode="server"
            data={state.list.currentData?.data ?? []}
            columns={columns}
            meta={state.list.currentData?.meta ?? EMPTY_META}
            loading={state.list.isFetching}
            showSearch={false}
            serverFilters={state.filters}
            onRequestChange={state.onRequestChange}
            enableVirtualization={false}
          />
        </CardContent>
      </Card>
      <ParcelSecondReceiverDialog state={state.secondReceiver} />
    </ScrollableWrapper>
  );
}
