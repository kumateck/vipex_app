type ProviderErrorBody = {
  detail: string;
  code: string | null;
  contentType: string | null;
};

function stringValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function isHtml(value: string) {
  return /<(?:!doctype\s+html|html|head|body|script|title)\b/i.test(value);
}

function isHtmlContentType(value: string | null) {
  const mediaType = value?.toLowerCase();
  return mediaType === 'text/html' || mediaType === 'application/xhtml+xml';
}

function clean(value: string) {
  return (
    value
      // eslint-disable-next-line no-control-regex -- Strip untrusted response control characters.
      .replace(/[\u0000-\u001f\u007f]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 400)
  );
}

/** Reads a provider error body once and avoids returning HTML pages to logs or customers. */
export async function readProviderHttpError(
  response: Response,
  redact: (value: string) => string,
): Promise<ProviderErrorBody> {
  const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim() || null;
  if (isHtmlContentType(contentType)) return { detail: '', code: null, contentType };
  let body = '';
  try {
    body = await response.text();
  } catch {
    return { detail: '', code: null, contentType };
  }

  try {
    const payload: unknown = JSON.parse(body);
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const nestedError =
        record.error && typeof record.error === 'object'
          ? (record.error as Record<string, unknown>)
          : null;
      const message = stringValue(record.message) || stringValue(nestedError?.message);
      const code = clean(redact(stringValue(record.code) || stringValue(nestedError?.code))).slice(
        0,
        80,
      );
      return {
        detail: isHtml(message) ? '' : clean(redact(message)),
        code: code || null,
        contentType,
      };
    }
  } catch {
    // Text responses are useful when they contain a provider reason; HTML is suppressed below.
  }

  return {
    detail: isHtml(body) ? '' : clean(redact(body)),
    code: null,
    contentType,
  };
}
