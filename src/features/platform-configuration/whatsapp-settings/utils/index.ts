import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';

export function getWhatsAppSettingsErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  return getErrorMessage(error, fallback);
}
