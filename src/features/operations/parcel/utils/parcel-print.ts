type PrintDocumentInput = {
  title: string;
  lines: string[];
};

export function printParcelDocument(input: PrintDocumentInput) {
  const printWindow = window.open('', '_blank', 'width=640,height=720');
  if (!printWindow) return;

  const content = input.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(input.title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h1 { font-size: 18px; margin-bottom: 12px; }
          p { margin: 6px 0; font-size: 13px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(input.title)}</h1>
        ${content}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
