import { ParcelReceiveScanner } from './parcel-receive-scanner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useParcelReceiveWorkflow } from './use-parcel-receive-workflow';
import { useParcelReceiveColumns } from './use-parcel-receive-columns';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function ParcelReceivePage() {
  const workflow = useParcelReceiveWorkflow();
  const {
    manualSearchInput,
    setManualSearchInput,
    manualQuery,
    manualResults,
    manualRows,
    manualServerFilters,
    isManualLoading,
    handleManualRequestChange,
    submitManualSearch,
  } = workflow;
  const manualColumns = useParcelReceiveColumns(workflow);

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <div className="space-y-4">
          <ParcelReceiveScanner workflow={workflow} />

          <Card>
            <CardHeader>
              <CardTitle>Manual Receive</CardTitle>
              <CardDescription>
                Search by tracking code, booking code, sender/receiver name or telephone, then
                confirm receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="flex items-center gap-2" onSubmit={submitManualSearch}>
                <Input
                  value={manualSearchInput}
                  onChange={(event) => setManualSearchInput(event.target.value)}
                  placeholder="Enter tracking, booking, sender/receiver name or phone"
                  className="h-11 text-base"
                />
                <Button
                  type="submit"
                  className="h-11 px-6"
                  disabled={manualSearchInput.trim().length === 0}
                >
                  Search
                </Button>
              </form>

              {manualQuery.search && manualQuery.search.trim().length > 0 ? (
                <DataTable
                  mode="server"
                  data={manualRows}
                  columns={manualColumns}
                  meta={manualResults?.meta ?? EMPTY_META}
                  loading={isManualLoading}
                  showSearch={false}
                  serverFilters={manualServerFilters}
                  onRequestChange={handleManualRequestChange}
                  enableVirtualization={false}
                />
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
                  Run a search to render matching incoming in-transit parcels.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollableWrapper>
    </div>
  );
}
