import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';

export function getUserErrorMessage(error: unknown, fallback = 'Something went wrong') {
  return getErrorMessage(error, fallback);
}
