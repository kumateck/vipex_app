import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';

export function getNotificationDispatchErrorMessage(
  error: unknown,
  fallback = 'Failed to retry dispatch',
) {
  return getErrorMessage(error, fallback);
}
