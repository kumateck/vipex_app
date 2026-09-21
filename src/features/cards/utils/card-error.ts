import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';

export function getCardErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  return getErrorMessage(error, fallback);
}
