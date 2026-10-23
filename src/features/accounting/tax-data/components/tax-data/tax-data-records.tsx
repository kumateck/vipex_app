import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { useTaxData } from '../../hooks';
import { taxDataMoney } from '../../utils';
import { TaxDataRowsTable } from './tax-data-rows-table';

export function TaxDataRecords({
  data,
  disabled,
}: {
  data: ReturnType<typeof useTaxData>;
  disabled: boolean;
}) {
  if (!data.scope?.showRecords) return null;
  if (data.recordsLoading) return <p role="status">Loading parcel tax records…</p>;
  if (data.recordsError)
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load records. Use Refresh or Get data to try again.
      </p>
    );
  if (!data.records) return null;
  const records = data.records;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Matching tax records</CardTitle>
        <CardDescription>
          {records.filters.amountPsw === undefined
            ? 'All principal-paid amounts'
            : `Principal paid: ${taxDataMoney(records.filters.amountPsw)}`}
          . Maximum {records.filters.maxOccurrences ?? 500} occurrences in total. One row per
          parcel; recorded principal payments are combined.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          disabled={!records.rows.length || disabled}
          onClick={() => data.selection.add(records.rows)}
        >
          Add this page to export list
        </Button>
        {records.rows.length ? (
          <TaxDataRowsTable
            rows={records.rows}
            mode="records"
            disabled={disabled}
            versions={data.selection.versions}
            onAdd={data.selection.add}
            onRemove={data.selection.remove}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No matching tax records.</p>
        )}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            variant="outline"
            disabled={records.page <= 1 || data.busy || disabled}
            onClick={() => data.loadPage(records.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {records.page} · up to {records.limit} records
          </span>
          <Button
            variant="outline"
            disabled={!records.hasMore || data.busy || disabled}
            onClick={() => data.loadPage(records.page + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
