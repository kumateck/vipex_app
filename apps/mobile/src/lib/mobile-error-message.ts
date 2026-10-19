type MobileErrorLike = {
  body?: unknown;
  cause?: unknown;
  data?: unknown;
  detail?: unknown;
  error?: unknown;
  errors?: unknown;
  message?: unknown;
  response?: unknown;
};

function readMobileErrorMessage(error: unknown, seen = new Set<object>()): string | null {
  if (!error) return null;
  if (typeof error === 'string') return error.trim() || null;
  if (typeof error !== 'object') return null;
  if (seen.has(error)) return null;
  seen.add(error);

  const value = error as MobileErrorLike;

  if (Array.isArray(value.errors)) {
    for (const item of value.errors) {
      const itemMessage = readMobileErrorMessage(item, seen);
      if (itemMessage) return itemMessage;
    }
  } else if (value.errors && typeof value.errors === 'object') {
    for (const item of Object.values(value.errors)) {
      const itemMessage = readMobileErrorMessage(Array.isArray(item) ? item[0] : item, seen);
      if (itemMessage) return itemMessage;
    }
  }

  for (const nested of [
    value.data,
    value.body,
    value.response,
    value.error,
    value.detail,
    value.cause,
  ]) {
    const nestedMessage = readMobileErrorMessage(nested, seen);
    if (nestedMessage) return nestedMessage;
  }

  if (typeof value.message === 'string' && value.message.trim()) return value.message.trim();

  return null;
}

export function getMobileErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  return readMobileErrorMessage(error) ?? fallback;
}
