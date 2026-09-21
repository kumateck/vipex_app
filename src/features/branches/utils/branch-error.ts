import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  return getApplicationErrorMessage(error, fallback);
}
