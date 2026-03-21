export function getCardErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  if (typeof error === 'string') return error;
  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    typeof (error as { data?: { message?: unknown } }).data?.message === 'string'
  ) {
    return (error as { data: { message: string } }).data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
