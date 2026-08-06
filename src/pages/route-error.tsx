import { Link, isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { useEffect } from 'react';
import { TheAduseiErrorResponse } from '@/lib/TheAduseiErrorResponse';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/** Fallback when a route throws; used as errorElement in the router. */
export default function RouteError() {
  const navigate = useNavigate();
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const title = isRouteErrorResponse(error)
    ? error.statusText || 'Request Error'
    : error instanceof Error
      ? 'Unexpected Application Error'
      : 'Something Went Wrong';
  const message = isRouteErrorResponse(error)
    ? typeof error.data === 'string'
      ? error.data
      : 'The requested page could not be completed.'
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred while loading this page.';
  const requestId =
    typeof error === 'object' && error !== null && 'requestId' in error
      ? String((error as { requestId?: string }).requestId ?? '')
      : '';

  useEffect(() => {
    TheAduseiErrorResponse(error, message);
  }, [error, message]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-destructive/20">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {status} • {title}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {requestId ? (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              Request ID: <span className="font-mono">{requestId}</span>
            </div>
          ) : null}

          <details className="rounded-md border bg-muted/20 p-3 text-sm">
            <summary className="cursor-pointer font-medium">Technical details</summary>
            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded bg-background p-3 text-xs">
              {error instanceof Error
                ? error.stack || error.message
                : JSON.stringify(error ?? { message: 'Unknown error' }, null, 2)}
            </pre>
          </details>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Go Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
