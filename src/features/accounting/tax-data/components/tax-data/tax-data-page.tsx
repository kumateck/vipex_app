import './tax-data.css';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useTaxData, useTaxDataActions } from '../../hooks';
import { TaxDataConfirmDialog, TaxDataFiltersDialog } from '../../dialogs';
import { TaxDataCounts } from './tax-data-counts';
import { TaxDataRecords } from './tax-data-records';
import { TaxDataExportList } from './tax-data-export-list';

export function TaxDataPage() {
  const data = useTaxData();
  const actions = useTaxDataActions(data);
  if (!data.allowed)
    return (
      <p role="alert" className="p-4">
        You do not have permission to view parcel tax data.
      </p>
    );
  return (
    <div className="w-full space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tax Data Generation</h1>
          <p className="text-sm text-muted-foreground">
            Count, select, export, and confirm recorded parcel tax data.
          </p>
        </div>
        <div className="flex gap-2">
          <TaxDataFiltersDialog data={data} disabled={actions.busy} />
          <Button
            variant="outline"
            disabled={!data.scope || data.busy || actions.busy}
            onClick={data.refresh}
          >
            Refresh
          </Button>
        </div>
      </header>
      <ScrollableWrapper>
        <div className="tax-data-content space-y-4">
          {data.scope ? (
            <p className="text-sm text-muted-foreground">
              Booked {data.scope.filters.date} · {data.scopeName} ·{' '}
              {data.scope.filters.confirmation} tax confirmation. Principal payments and tax amounts
              reflect current records.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Open Filters, choose a route and booking date, then Count. Select an amount and
              maximum occurrences to Get data.
            </p>
          )}
          <div className="grid items-start gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <TaxDataCounts data={data} />
            <TaxDataRecords data={data} disabled={actions.busy} />
          </div>
          <TaxDataExportList data={data} actions={actions} />
        </div>
      </ScrollableWrapper>
      <TaxDataConfirmDialog data={data} actions={actions} />
    </div>
  );
}
