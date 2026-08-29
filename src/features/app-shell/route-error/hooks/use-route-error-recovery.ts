import { useCallback, useEffect } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import {
  TheAduseiErrorResponse,
  hardReloadApplication,
  isLikelyStaleBuildError,
  tryRecoverFromStaleBuildError,
} from '@/lib/TheAduseiErrorResponse';

export function useRouteErrorRecovery() {
  const navigate = useNavigate();
  const error = useRouteError();
  const isStaleBuild = isLikelyStaleBuildError(error);
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
    if (isStaleBuild) {
      tryRecoverFromStaleBuildError(error);
      return;
    }
    TheAduseiErrorResponse(error, message);
  }, [error, isStaleBuild, message]);

  const goBack = useCallback(() => navigate(-1), [navigate]);

  return { error, goBack, hardReloadApplication, isStaleBuild, message, requestId, status, title };
}
