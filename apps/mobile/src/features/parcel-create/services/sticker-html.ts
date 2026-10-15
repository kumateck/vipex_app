import qrcode from 'qrcode-generator';
import stickerLogo from './sticker-logo-data-uri.json';

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
  callSender?: boolean;
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
  return emphasis ? '3.9mm' : '3.65mm';
}

function destinationFontSize(value: string) {
  if (value.length > 30) return '3mm';
  if (value.length > 24) return '3.4mm';
  if (value.length > 18) return '3.8mm';
  return '4.5mm';
}

function locationFontSize(value: string) {
  if (value.length > 18) return '3.1mm';
  if (value.length > 10) return '3.6mm';
  return '4.2mm';
}

// Sized so typical names stay on one line and the receiver phone always has room below.
function receiverNameFontSize(value: string) {
  const length = value.trim().length;
  if (length > 26) return '3.2mm';
  if (length > 18) return '3.8mm';
  if (length > 12) return '4.4mm';
  return '5mm';
}

export function buildMobileStickerHtml(sticker: MobileSticker) {
  const copies = sticker.copies;
  if (!Number.isSafeInteger(copies) || copies < 1)
    throw new Error('Sticker copies must be a positive whole number');
  const display = (value: string) => escapeHtml(value.trim() || '-');
  const row = (label: string, value: string) =>
    `<div class="row"><div class="label">${label}</div><div class="value" style="font-size:${valueFontSize(value, true)}">${display(value)}</div></div>`;
  const destination = (label: string, value: string, large = false) =>
    `<div><div class="label">${label}</div><div class="destination-value" style="font-size:${large ? destinationFontSize(value) : locationFontSize(value)}">${display(value)}</div></div>`;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
  <style>@page{size:90mm 92mm;margin:0}*{box-sizing:border-box}body{margin:0;color:#000;font-family:Arial,sans-serif}
  .sticker{width:90mm;height:92mm;border:.35mm solid #111;padding:1.2mm;display:grid;grid-template-rows:22mm auto auto minmax(0,1fr);gap:.7mm;overflow:hidden;page-break-after:always}
  .sticker:last-child{page-break-after:auto}.top{min-width:0;display:grid;grid-template-columns:11mm 1fr 22mm;align-items:center;column-gap:2mm}
  .logo{width:11mm;height:11mm;object-fit:contain}.brand{display:inline-flex;align-items:center;gap:.9mm;font-weight:900;white-space:nowrap}.brand-main{font-size:7.2mm;line-height:.82}.brand-sub{font-size:7.2mm;line-height:.82;letter-spacing:.02em}
  .qr-panel{width:21mm;height:21mm;background:#fff;justify-self:end}.qr{border-collapse:collapse;width:21mm;height:21mm;table-layout:fixed}.qr td{padding:0}
  .due{border:.35mm solid #111;display:grid;place-items:center;text-align:center;padding:.7mm .5mm}.due-title{font-size:4.2mm;font-weight:900;line-height:1.1}.amount{margin-top:.3mm;font-size:4mm;font-weight:900;line-height:1.1}.note{margin-top:.6mm;font-size:1.9mm;font-weight:700;line-height:1.2}
  .receiver{position:relative;border:.35mm solid #111;display:grid;grid-template-rows:auto auto auto;row-gap:.5mm;text-align:center;padding:.8mm 1mm}.receiver .label{font-size:1.8mm}.receiver-name{padding:0 4.5mm;font-weight:900;line-height:1.1;overflow-wrap:anywhere}.receiver-phone{font-size:3.9mm;font-weight:900;line-height:1.15}.cs{position:absolute;top:.4mm;right:.6mm;border:.4mm solid #111;padding:.1mm .6mm;background:#fff;color:#000;font-size:3.2mm;font-weight:900;line-height:1}
  .main{min-height:0;display:grid;grid-template-rows:auto auto auto minmax(0,1fr);overflow:hidden}.destination{border-top:.35mm solid #111;padding:.5mm 0 .6mm;display:grid;grid-template-columns:1.25fr .75fr;gap:1.2mm;align-items:start}.label{font-size:2mm;font-weight:700;line-height:1.15;text-transform:uppercase}.destination-value{font-weight:800;line-height:1.05;overflow-wrap:anywhere}.row{min-width:0;border-top:.35mm solid #111;padding:.5mm .8mm .6mm;text-align:center}.value{font-weight:700;line-height:1.1;overflow-wrap:anywhere}
  </style></head><body>${Array.from(
    { length: copies },
    () => `<div class="sticker"><header class="top"><img class="logo" src="${stickerLogo.dataUri}" alt="Vipex logo"><div class="brand"><span class="brand-main">VIPEX</span><span class="brand-sub">PARCEL</span></div><div class="qr-panel">${qrTable(sticker.trackingCode)}</div></header>
  <section class="due"><div><div class="due-title">TO BE PAID</div><div class="amount">GHS ${sticker.amountCedis.toFixed(2)}</div><div class="note">PLEASE NOTE: PAYMENT DUE UPON RECEIPT OF PARCEL.</div></div></section>
  <section class="receiver">${sticker.callSender ? '<span class="cs">CS</span>' : ''}<div class="label">Receiver</div><div class="receiver-name" style="font-size:${receiverNameFontSize(sticker.receiverName)}">${display(sticker.receiverName)}</div><div class="receiver-phone">${display(sticker.receiverPhone)}</div></section>
  <main class="main"><div class="destination">${destination('Destination', sticker.destinationBranch, true)}${destination('Location', sticker.destinationLocation)}</div>${row('Sender', sticker.senderName)}${row('Sender Tel', sticker.senderPhone)}${row('Parcel Details', sticker.parcelDetails)}</main>
  </div>`,
  ).join('')}</body></html>`;
}
