export function getStatusErrorMessage(error: unknown, fallback = 'Something went wrong') {
  const message =
    error &&
    typeof error === 'object' &&
    'data' in error &&
    typeof (error as { data?: { message?: unknown } }).data?.message === 'string'
      ? (error as { data: { message: string } }).data.message
      : null;

  if (message) return message;

  return error instanceof Error && error.message ? error.message : fallback;
}
