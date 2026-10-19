import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';

export function getInventoryCategoryErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  return getErrorMessage(error, fallback);
}
