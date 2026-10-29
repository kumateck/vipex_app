import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { useTaxData, useTaxDataActions } from '../../hooks';
import { taxDataMoney } from '../../utils';
import { TaxDataRowsTable } from './tax-data-rows-table';

export function TaxDataExportList({
  data,
  actions,
}: {
  data: ReturnType<typeof useTaxData>;
  actions: ReturnType<typeof useTaxDataActions>;
}) {
  const selected = data.selection;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export list · {selected.rows.length} / 500 parcels</CardTitle>
        <CardDescription>
          Principal paid: {taxDataMoney(selected.totals.paidPrincipalPsw)} · Recorded tax:{' '}
          {taxDataMoney(selected.totals.taxTotalPsw)}. Add records across dates and amounts. Export
          and confirmation revalidate the selected records.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!selected.rows.length || actions.busy}
            onClick={() => void actions.download()}
          >
            {actions.exporting ? 'Exporting…' : 'Export Excel'}
          </Button>
          {data.canConfirm ? (
            <Button
              variant="outline"
              disabled={!selected.rows.length || actions.busy}
              onClick={() => actions.setConfirmOpen(true)}
            >
              Confirm tax data
            </Button>
          ) : null}
          <Button
            variant="outline"
            disabled={!selected.rows.length || actions.busy}
            onClick={selected.clear}
          >
            Reset export list
          </Button>
        </div>
        {selected.rows.length ? (
          <TaxDataRowsTable
            rows={selected.rows}
            mode="selection"
            disabled={actions.busy}
            versions={selected.versions}
            onAdd={selected.add}
            onRemove={selected.remove}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Get data and add parcels to build the export list.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
