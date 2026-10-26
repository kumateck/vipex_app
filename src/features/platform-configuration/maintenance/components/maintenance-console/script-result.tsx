import { Badge } from '@/components/ui/badge';
import type { MaintenanceRun } from '../../types';

export function ScriptResult({ run }: { run: MaintenanceRun | null }) {
  if (!run)
    return (
      <div className="border-t pt-5 text-sm text-muted-foreground">
        Results appear here after a script finishes.
      </div>
    );
  return (
    <section aria-label="Script result" aria-live="polite" className="space-y-3 border-t pt-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium">Result</h3>
        <Badge variant={run.status === 'failed' ? 'destructive' : 'outline'}>
          {run.mode === 'preview' ? 'Preview' : 'Execution'} · {run.status}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed">
        {run.result?.summary ??
          run.error ??
          'This run is still running or was interrupted. Check history before retrying.'}
      </p>
      {run.result ? (
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            View record details
          </summary>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs leading-relaxed">
            {JSON.stringify(run.result.details, null, 2)}
          </pre>
        </details>
      ) : null}
    </section>
  );
}
