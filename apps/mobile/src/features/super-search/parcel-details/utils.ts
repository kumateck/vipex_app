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
