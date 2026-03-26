import { Button } from '@/components/ui/button';
import { downloadCsv } from '../utils/export-csv';

export type DashboardExportRow = {
  metric: string;
  value: string | number;
};

export function DashboardExportActions({
  filenamePrefix,
  rows,
  disabled = false,
}: {
  filenamePrefix: string;
  rows: DashboardExportRow[];
  disabled?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={disabled || !rows.length}
        onClick={() =>
          downloadCsv(
            `${filenamePrefix}-${today}.csv`,
            ['Metric', 'Value'],
            rows.map((row) => [row.metric, row.value]),
          )
        }
      >
        Export CSV
      </Button>
      <Button type="button" variant="outline" disabled={disabled} onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}
