export function getNotificationDispatchErrorMessage(
  error: unknown,
  fallback = 'Failed to retry dispatch',
) {
  if (error instanceof Error && error.message) return error.message;
  if (
    error &&
    typeof error === 'object' &&
    typeof (error as { data?: { message?: unknown } }).data?.message === 'string'
  ) {
    return (error as { data: { message: string } }).data.message;
  }
  return fallback;
}
