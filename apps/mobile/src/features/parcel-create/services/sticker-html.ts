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

function valueFontSize(value: string, emphasis = false) {
  if (value.length > 54) return emphasis ? '1.9mm' : '1.8mm';
  if (value.length > 48) return emphasis ? '2.1mm' : '1.95mm';
  if (value.length > 42) return emphasis ? '2.35mm' : '2.15mm';
  if (value.length > 34) return emphasis ? '2.65mm' : '2.4mm';
  if (value.length > 26) return emphasis ? '3mm' : '2.75mm';
  if (value.length > 20) return emphasis ? '3.45mm' : '3.1mm';
  return emphasis ? '4.2mm' : '3.65mm';
}

function destinationFontSize(value: string) {
  if (value.length > 30) return '3mm';
  if (value.length > 24) return '3.4mm';
  if (value.length > 18) return '3.8mm';
  return '4.5mm';
}

export function buildMobileStickerHtml(sticker: MobileSticker) {
  const copies = sticker.copies;
  if (!Number.isSafeInteger(copies) || copies < 1)
    throw new Error('Sticker copies must be a positive whole number');
  const display = (value: string) => escapeHtml(value.trim() || '-');
  const row = (label: string, value: string) =>
    `<div class="row"><div class="label">${label}</div><div class="value" style="font-size:${valueFontSize(value, true)}">${display(value)}</div></div>`;
  const destination = (label: string, value: string, large = false) =>
    `<div><div class="label">${label}</div><div class="destination-value" style="font-size:${large ? destinationFontSize(value) : value.length > 18 ? '3.3mm' : '4.2mm'}">${display(value)}</div></div>`;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
  <style>@page{size:90mm 92mm;margin:0}*{box-sizing:border-box}body{margin:0;color:#000;font-family:Arial,sans-serif}
  .sticker{width:90mm;height:92mm;border:.35mm solid #111;padding:1.2mm;display:grid;grid-template-rows:25mm 12.5mm 18mm minmax(0,1fr);gap:.5mm;overflow:hidden;page-break-after:always}
  .sticker:last-child{page-break-after:auto}.top{min-width:0;display:grid;grid-template-columns:11mm 1fr 23mm;align-items:center;column-gap:2mm}
  .logo{width:11mm;height:11mm;border:1px solid #111;border-radius:50%;display:grid;place-items:center;font-size:2.2mm;font-weight:900}.brand{display:inline-flex;align-items:center;gap:.9mm;font-weight:900;white-space:nowrap}.brand-main{font-size:7.2mm;line-height:.82}.brand-sub{font-size:7.2mm;line-height:.82;letter-spacing:.02em}
  .qr-panel{width:22mm;height:22mm;background:#fff}.qr{border-collapse:collapse;width:22mm;height:22mm;table-layout:fixed}.qr td{padding:0}
  .due{border:.35mm solid #111;display:grid;place-items:start center;text-align:center;padding:.45mm .25mm .9mm;overflow:hidden}.due-title{font-size:4.4mm;font-weight:900;line-height:1}.amount{margin-top:.1mm;font-size:3.7mm;font-weight:900;line-height:1}.note{margin-top:.35mm;font-size:1.9mm;font-weight:700;line-height:1}
  .receiver{border:.35mm solid #111;display:grid;grid-template-rows:auto minmax(0,1fr) auto;text-align:center;padding:.3mm 1mm;overflow:hidden}.receiver-name{margin-top:.25mm;display:grid;place-items:center;overflow:hidden;font-size:5.3mm;font-weight:900;line-height:.95;overflow-wrap:anywhere}.receiver-phone{margin-top:.3mm;font-size:3.9mm;font-weight:900;line-height:1}
  .main{min-height:0;display:grid;grid-template-rows:10.5mm 6.5mm 6.5mm minmax(11mm,1fr);overflow:hidden}.destination{border-top:.35mm solid #111;padding:.35mm 0;display:grid;grid-template-columns:1.25fr .75fr;gap:1.2mm}.label{font-size:2mm;font-weight:700;line-height:1;text-transform:uppercase}.destination-value{font-weight:800;line-height:.86;overflow-wrap:anywhere}.row{min-width:0;border-top:.35mm solid #111;padding:.45mm .8mm;overflow:hidden;text-align:center}.value{font-weight:700;line-height:.9;overflow:hidden;overflow-wrap:anywhere}
  </style></head><body>${Array.from(
    { length: copies },
    () => `<div class="sticker"><header class="top"><div class="logo">VP</div><div class="brand"><span class="brand-main">VIPEX</span><span class="brand-sub">PARCEL</span></div><div class="qr-panel">${qrTable(sticker.trackingCode)}</div></header>
  <section class="due"><div><div class="due-title">TO BE PAID</div><div class="amount">GHS ${sticker.amountCedis.toFixed(2)}</div><div class="note">PLEASE NOTE: PAYMENT DUE UPON RECEIPT OF PARCEL.</div></div></section>
  <section class="receiver"><div class="label">Receiver</div><div class="receiver-name">${display(sticker.receiverName)}</div><div class="receiver-phone">${display(sticker.receiverPhone)}</div></section>
  <main class="main"><div class="destination">${destination('Destination', sticker.destinationBranch, true)}${destination('Location', sticker.destinationLocation)}</div>${row('Sender', sticker.senderName)}${row('Sender Tel', sticker.senderPhone)}${row('Parcel Details', sticker.parcelDetails)}</main>
  </div>`,
  ).join('')}</body></html>`;
}
