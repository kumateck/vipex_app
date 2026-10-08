export function receiptRollPageStyle(width: 58 | 80, height = 297) {
  return `
    @media print {
      @page { size: ${width}mm ${height}mm; margin: 0; }
      html, body { width: ${width}mm; height: auto; margin: 0; padding: 0;
        overflow: visible; display: block; background: #fff; color: #000;
        -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .thermal-receipt-root { margin: 0; transform: none; }
    }
  `;
}
