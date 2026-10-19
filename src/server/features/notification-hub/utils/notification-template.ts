export function normalizeChannel(channel: string) {
  return channel.trim().toLowerCase();
}

export function normalizeEventCode(eventCode?: string | null) {
  const value = eventCode?.trim();
  return value ? value.toLowerCase() : null;
}

export function renderTemplate(
  template: string,
  values: Record<string, string | number | null | undefined>,
) {
  return template.replace(/{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g, (token, key: string) =>
    Object.hasOwn(values, key) ? String(values[key] ?? '') : token,
  );
}
