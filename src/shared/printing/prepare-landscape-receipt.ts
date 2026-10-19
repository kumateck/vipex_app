/** Self-contained: Electron serializes this function into its isolated print document. */
export function prepareLandscapeReceipt(document: Document): number | undefined {
  const root = document.querySelector<HTMLElement>(
    '.invoice-a5-root[data-receipt-paper="xprinter-80mm-landscape"]',
  );
  if (!root) return undefined;
  document.body.append(root);
  root.style.position = 'absolute';
  // Measure the original landscape artwork before applying the paper rotation.
  root.style.transform = 'none';
  const { width, height } = root.getBoundingClientRect();
  if (![width, height].every((value) => Number.isFinite(value) && value > 0))
    throw new Error('Landscape receipt dimensions are invalid');
  const pixelsPerMm = 96 / 25.4;
  const paperWidth = 80 * pixelsPerMm;
  const printableWidth = 72 * pixelsPerMm;
  // After rotation the artwork height spans the roll: fit that dimension exactly,
  // including compact receipts, rather than leaving unused printable width.
  const scale = printableWidth / height;
  const pageHeight = Math.ceil(width * scale + 4 * pixelsPerMm);
  if (pageHeight > 2000 * pixelsPerMm) throw new Error('Receipt exceeds the supported roll length');
  const left = (paperWidth - height * scale) / 2;
  // Counterclockwise rotation sends the artwork above its origin; move it down by
  // its scaled width so all four corners remain inside the roll, with feed clearance.
  const top = width * scale + 2 * pixelsPerMm;
  const style = document.createElement('style');
  style.textContent = `
    @page { size: 80mm ${pageHeight / pixelsPerMm}mm; margin: 0; }
    html, body { width: 80mm !important; height: ${pageHeight}px !important;
      min-height: 0 !important; margin: 0 !important; padding: 0 !important;
      display: block !important; overflow: hidden !important; }
    body { position: relative !important; }
  `;
  document.head.append(style);
  Object.assign(root.style, {
    position: 'absolute',
    margin: '0',
    top: '0',
    left: '0',
    transformOrigin: '0 0',
    transform: `translate(${left}px, ${top}px) rotate(-90deg) scale(${scale})`,
  });
  return pageHeight;
}
