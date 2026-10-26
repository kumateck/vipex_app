import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/dates';
import type { MaintenanceRun, MaintenanceScript } from '../../types';

export function RunHistory({
  runs,
  scripts,
  loading,
  error,
  onRefresh,
  onSelect,
}: {
  runs: MaintenanceRun[];
  scripts: MaintenanceScript[];
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
  onSelect: (run: MaintenanceRun) => void;
}) {
  return (
    <section className="space-y-4 border-t pt-6" aria-label="Recent script runs">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Recent runs</h2>
        <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        The latest 20 runs in your company. Every run records the System Admin who started it.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Run history could not load. Select Refresh to try again.
        </p>
      ) : !runs.length ? (
        <p className="py-4 text-sm text-muted-foreground">
          {loading ? 'Loading run history…' : 'No scripts have been run yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="p-3">Script</th>
                <th className="p-3">Started</th>
                <th className="p-3">System Admin</th>
                <th className="p-3">Status</th>
                <th className="p-3">
                  <span className="sr-only">Result</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">
                      {scripts.find((script) => script.id === run.operationId)?.title ??
                        run.operationId}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {run.mode === 'preview' ? 'Preview' : 'Execution'}
                      {run.params.bookingCode ? ` · ${run.params.bookingCode}` : ''}
                    </p>
                  </td>
                  <td className="p-3 tabular-nums">{formatDateTime(new Date(run.createdAt))}</td>
                  <td className="p-3">{run.actorName ?? 'System Admin'}</td>
                  <td className="p-3">
                    <Badge variant={run.status === 'failed' ? 'destructive' : 'outline'}>
                      {run.status === 'running' ? 'Running / interrupted' : run.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelect(run)}
                      aria-label={`View result for ${run.operationId} started ${run.createdAt}`}
                    >
                      View result
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
