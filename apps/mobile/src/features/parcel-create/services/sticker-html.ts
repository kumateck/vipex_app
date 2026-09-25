import qrcode from 'qrcode-generator';

export type MobileSticker = {
  bookingCode: string;
  trackingCode: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  destinationBranch: string;
  destinationLocation: string;
  parcelDetails: string;
  amountCedis: number;
  copies: number;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  );
}

function qrTable(trackingCode: string) {
  const qr = qrcode(0, 'Q');
  qr.addData(`https://vipexparcel.com/tracking/${encodeURIComponent(trackingCode)}`);
  qr.make();
  const rows = Array.from(
    { length: qr.getModuleCount() },
    (_, row) =>
      `<tr>${Array.from(
        { length: qr.getModuleCount() },
        (_, column) => `<td style="background:${qr.isDark(row, column) ? '#000' : '#fff'}"></td>`,
      ).join('')}</tr>`,
  );
  return `<table class="qr" cellspacing="0" cellpadding="0">${rows.join('')}</table>`;
}

export function buildMobileStickerHtml(sticker: MobileSticker) {
  const copies = sticker.copies;
  if (!Number.isSafeInteger(copies) || copies < 1)
    throw new Error('Sticker copies must be a positive whole number');
  const field = (label: string, value: string) =>
    `<div class="field"><small>${label}</small><strong>${escapeHtml(value || '-')}</strong></div>`;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
  <style>@page{size:90mm 92mm;margin:0}*{box-sizing:border-box}body{margin:0;color:#000;font-family:Arial,sans-serif}
  .sticker{width:90mm;height:92mm;padding:2mm;border:1px solid #000;overflow:hidden;page-break-after:always}
  .sticker:last-child{page-break-after:auto}.top{display:flex;justify-content:space-between;height:30mm}.brand{font-weight:900;font-size:18pt}
  .qr-panel{width:30mm;height:30mm;background:#fff;padding:2mm}.qr{border-collapse:collapse;width:26mm;height:26mm;table-layout:fixed}.qr td{padding:0}
  .due{border:2px solid #000;text-align:center;font-size:17pt;font-weight:900;padding:2mm}
  .amount{text-align:center;font-size:13pt;font-weight:bold;margin:1mm 0 3mm}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:2mm}.field{border-bottom:1px solid #999;padding:1mm 0}
  .field small{display:block;font-size:7pt}.field strong{font-size:10pt;overflow-wrap:anywhere}
  </style></head><body>${Array.from(
    { length: copies },
    () => `<div class="sticker"><div class="top"><div class="brand">VIPEX<br>PARCEL</div><div class="qr-panel">${qrTable(sticker.trackingCode)}</div></div>
  <div class="due">TO BE PAID</div><div class="amount">GHS ${sticker.amountCedis.toFixed(2)}</div>
  <div class="grid">${field('BOOKING', sticker.bookingCode)}${field('DESTINATION', sticker.destinationBranch)}
  ${field('LOCATION', sticker.destinationLocation)}${field('PARCEL', sticker.parcelDetails)}
  ${field('SENDER', sticker.senderName)}${field('SENDER TEL', sticker.senderPhone)}
  ${field('RECEIVER', sticker.receiverName)}${field('RECEIVER TEL', sticker.receiverPhone)}</div>
  </div>`,
  ).join('')}</body></html>`;
}
