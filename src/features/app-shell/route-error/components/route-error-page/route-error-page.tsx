import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouteErrorRecovery } from '../../hooks/use-route-error-recovery';
import { StaleBuildRecoveryView } from './stale-build-recovery-view';

export function RouteErrorPage() {
  const model = useRouteErrorRecovery();

  if (model.isStaleBuild) {
    return <StaleBuildRecoveryView onReload={model.hardReloadApplication} />;
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-destructive/20">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {model.status} • {model.title}
          </CardTitle>
          <CardDescription>{model.message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {model.requestId ? (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              Request ID: <span className="font-mono">{model.requestId}</span>
            </div>
          ) : null}

          <details className="rounded-md border bg-muted/20 p-3 text-sm">
            <summary className="cursor-pointer font-medium">Technical details</summary>
            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded bg-background p-3 text-xs">
              {model.error instanceof Error
                ? model.error.stack || model.error.message
                : JSON.stringify(model.error ?? { message: 'Unknown error' }, null, 2)}
            </pre>
          </details>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center gap-2">
          <Button onClick={model.hardReloadApplication}>Reload</Button>
          <Button variant="outline" onClick={model.goBack}>
            Go Back
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Go Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
