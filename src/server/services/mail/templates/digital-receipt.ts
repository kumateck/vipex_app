const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export function buildDigitalReceiptEmail(input: {
  title: string;
  customerName: string;
  bookingCode: string;
  amountPaid: string;
  balance: string;
  destination: string;
  receiptUrl: string;
}) {
  const subject = `VIPEX ${input.title} – booking ${input.bookingCode}`;
  const name = escapeHtml(input.customerName);
  const rows = [
    ['Booking code', input.bookingCode],
    ['Destination', input.destination],
    ['Amount paid', input.amountPaid],
    ['Balance to pay', input.balance],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${escapeHtml(label!)}</td><td style="padding:4px 0;font-weight:600">${escapeHtml(value!)}</td></tr>`,
    )
    .join('');
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
      <h2>${escapeHtml(input.title)}</h2>
      <p>Hello ${name}, thank you for choosing VIPEX.</p>
      <table style="border-collapse:collapse;margin:12px 0">${rows}</table>
      <p style="margin:20px 0">
        <a href="${escapeHtml(input.receiptUrl)}" style="background:#111827;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">View your receipt</a>
      </p>
      <p style="color:#6b7280;font-size:12px">The online copy is identical to your printed receipt. If the button does not work, open ${escapeHtml(input.receiptUrl)}</p>
    </div>
  `;
  const text = `${input.title}

Hello ${input.customerName}, thank you for choosing VIPEX.
Booking code: ${input.bookingCode}
Destination: ${input.destination}
Amount paid: ${input.amountPaid}
Balance to pay: ${input.balance}

View your receipt: ${input.receiptUrl}`;
  return { subject, html, text };
}
