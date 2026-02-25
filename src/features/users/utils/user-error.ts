export function getUserErrorMessage(error: unknown, fallback = 'Something went wrong') {
  const apiMessage =
    error &&
    typeof error === 'object' &&
    'data' in error &&
    typeof (error as { data?: { message?: unknown } }).data?.message === 'string'
      ? (error as { data: { message: string } }).data.message
      : null;

  if (apiMessage) return apiMessage;
  return error instanceof Error && error.message ? error.message : fallback;
}
