export function printViaBrowserPopup(html: string, features = 'noopener,noreferrer') {
  if (typeof window === 'undefined') return false;

  const printWindow = window.open('', '_blank', features);
  if (!printWindow) return false;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();

  return true;
}
