type MutableRecord = Record<string, unknown>;

export function toOptionalString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeOptionalFields<T extends MutableRecord, K extends keyof T>(
  input: T,
  optionalKeys: readonly K[],
): T {
  const normalized = { ...input } as T;

  for (const key of optionalKeys) {
    const value = normalized[key];
    (normalized as MutableRecord)[key as string] =
      typeof value === 'string' ? toOptionalString(value) : value ?? undefined;
  }

  return normalized;
}
