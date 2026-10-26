import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import type { MaintenanceConsoleState } from '../../hooks';
import { ScriptList } from './script-list';
import { ScriptForm } from './script-form';
import { ScriptResult } from './script-result';
import { RunHistory } from './run-history';

export function MaintenanceView({ state }: { state: MaintenanceConsoleState }) {
  return (
    <ScrollableWrapper>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance Scripts</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Inspect records and run supported repairs for your company. Access is restricted to
            System Admins.
          </p>
        </header>
        {state.catalog.isError ? (
          <div role="alert" className="space-y-3 rounded-lg border p-5">
            <p>The script catalog could not load.</p>
            <Button variant="outline" onClick={() => void state.catalog.refetch()}>
              Try again
            </Button>
          </div>
        ) : state.catalog.isLoading ? (
          <p role="status" className="py-8 text-sm text-muted-foreground">
            Loading maintenance scripts…
          </p>
        ) : !state.scripts.length ? (
          <p className="py-8 text-sm text-muted-foreground">
            No maintenance scripts are available.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)]">
            <aside className="space-y-3">
              <h2 className="text-sm font-semibold">Available scripts ({state.scripts.length})</h2>
              <ScriptList
                scripts={state.scripts}
                selectedId={state.selected?.id}
                disabled={state.busy}
                onSelect={state.selectScript}
              />
            </aside>
            <div className="min-w-0 space-y-5 rounded-xl border p-4 sm:p-6">
              <ScriptForm state={state} />
              {state.error ? (
                <p role="alert" className="text-sm leading-relaxed text-destructive">
                  {state.error}
                </p>
              ) : null}
              <ScriptResult run={state.result} />
            </div>
          </div>
        )}
        <RunHistory
          runs={state.runs}
          scripts={state.scripts}
          loading={state.history.isFetching}
          error={state.history.isError}
          onRefresh={() => void state.history.refetch()}
          onSelect={state.showResult}
        />
      </div>
    </ScrollableWrapper>
  );
}
