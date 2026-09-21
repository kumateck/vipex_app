import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';

export function getInventoryLocationErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  return getErrorMessage(error, fallback);
}
