import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';

export function getInventoryStockErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  return getErrorMessage(error, fallback);
}
