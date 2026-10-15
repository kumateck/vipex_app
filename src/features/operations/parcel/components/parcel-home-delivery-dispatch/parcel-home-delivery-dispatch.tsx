import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { ParcelStatus } from '@/db/schemas/enums';
import { EMPTY_META } from '../../home-delivery-pickup/utils';
import { useHomeDeliveryDispatch } from './hooks';
import { useHomeDeliveryDispatchColumns } from './use-home-delivery-dispatch-columns';
import { HomeDeliveryReceiptPrintController } from './home-delivery-receipt-print-controller';

export function ParcelHomeDeliveryDispatch() {
  const state = useHomeDeliveryDispatch();
  const {
    companyId,
    branchId,
    searchInput,
    setSearchInput,
    selectedIds,
    riderUserId,
    setRiderUserId,
    printData,
    listQuery,
    isDispatching,
    riderOptions,
    onDispatch,
    onSearch,
    onRequestChange,
    onPrintComplete,
  } = state;
  const columns = useHomeDeliveryDispatchColumns(state);
  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Home Delivery Dispatch</CardTitle>
            <CardDescription>
              Load address-collected parcels, then dispatch them to a rider by area. Rider returns
              are reprocessed on the Rider Returns page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                onSearch();
              }}
            >
              <input
                className="h-10 rounded-md border px-3 w-full"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by tracking, booking, receiver or area"
              />
              <Button type="submit">Search</Button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={riderUserId} onValueChange={setRiderUserId}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select rider" />
                </SelectTrigger>
                <SelectContent>
                  {riderOptions.map((rider) => (
                    <SelectItem key={rider.id} value={rider.id}>
                      {rider.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onDispatch} disabled={isDispatching}>
                {isDispatching ? 'Dispatching...' : `Dispatch Selected (${selectedIds.length})`}
              </Button>
            </div>

            <DataTable
              mode="server"
              data={listQuery.data?.data ?? []}
              columns={columns}
              meta={listQuery.data?.meta ?? EMPTY_META}
              loading={listQuery.isLoading}
              showSearch={false}
              serverFilters={{
                companyId,
                destinationId: branchId,
                statuses: [ParcelStatus.ADDRESS_COLLECTED],
              }}
              onRequestChange={onRequestChange}
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
      {printData ? (
        <HomeDeliveryReceiptPrintController
          key={printData.trackingCode}
          receipt={printData}
          onComplete={onPrintComplete}
        />
      ) : null}
    </div>
  );
}
