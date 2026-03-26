function escapeCsv(value: string | number) {
  const stringValue = String(value);
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) {
  if (typeof window === 'undefined') return;
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
