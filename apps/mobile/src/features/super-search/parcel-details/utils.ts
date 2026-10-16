export function formatCedis(psw: number | null | undefined) {
  return `GH₵ ${((psw ?? 0) / 100).toFixed(2)}`;
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export function detailLine(label: string, value: string) {
  return `${label}: ${value}`;
}

export function paymentMethodLabel(method: number | null | undefined) {
  if (method == null) return '-';
  if (method === 0) return 'Cash';
  if (method === 1) return 'Mobile Money';
  if (method === 2) return 'Card';
  if (method === 3) return 'Bank Transfer';
  return `Method ${method}`;
}

export function prettyRoute(
  sourceBranch: string,
  sourceLocation: string,
  destinationBranch: string,
  destinationLocation: string,
) {
  return `${sourceBranch} (${sourceLocation}) -> ${destinationBranch} (${destinationLocation})`;
}

export function branchLocationLabel(branchName?: string | null, locationName?: string | null) {
  const branch = branchName?.trim() || '-';
  const location = locationName?.trim() || '-';
  return `${branch} (${location})`;
}

export function personName(userNames: Record<string, string> | undefined, id?: string | null) {
  if (!id) return '-';
  return userNames?.[id] ?? 'Unknown user';
}

export function joinPhones(...phones: Array<string | null | undefined>) {
  return phones.filter(Boolean).join(' / ') || '-';
}

/** Newest day first and newest entry first within a day, keyed by the device's local date. */
export function groupHistoryByDay<T extends { occurredAt: string }>(events: T[]) {
  const groups = new Map<string, T[]>();
  for (const event of events) {
    const date = new Date(event.occurredAt);
    const key = Number.isNaN(date.getTime())
      ? 'Unknown date'
      : date.toLocaleDateString(undefined, {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()]
    .map(([day, items]) => ({ day, items: [...items].reverse() }))
    .reverse();
}
