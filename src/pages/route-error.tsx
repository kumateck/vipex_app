import { useRouteError, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { TheAduseiErrorResponse } from '@/lib/TheAduseiErrorResponse';

/** Fallback when a route throws; used as errorElement in the router. */
export default function RouteError() {
  const error = useRouteError();
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'statusText' in error
        ? String((error as { statusText?: string }).statusText || 'Something went wrong')
        : 'Something went wrong';

  useEffect(() => {
    TheAduseiErrorResponse(error, message);
  }, [error, message]);

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6">
      <p className="text-destructive">{message}</p>
      <Link to="/" className="text-primary underline">
        Go home
      </Link>
    </div>
  );
}
