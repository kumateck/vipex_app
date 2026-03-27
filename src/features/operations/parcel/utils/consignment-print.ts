import type { ProcessedParcel } from '../api/parcel.api';

type ConsignmentPrintPayload = {
  consignmentCode: string;
  consignmentDate: string;
  sourceBranchName: string;
  destinationBranchName: string;
  createdByLabel: string;
  items: ProcessedParcel[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function escapeHtml(value: string | null | undefined) {
  const safe = value ?? '-';
  return safe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function printConsignmentSlip(payload: ConsignmentPrintPayload) {
  if (typeof window === 'undefined') return false;

  const printWindow = window.open('', '_blank', 'width=980,height=760,noopener,noreferrer');
  if (!printWindow) return false;

  const rows = payload.items
    .map(
      (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.trackingCode)}</td>
        <td>${escapeHtml(item.bookingCode)}</td>
        <td>${escapeHtml(item.senderName)}</td>
        <td>${escapeHtml(item.senderPhone)}</td>
        <td>${escapeHtml(item.receiverName)}</td>
        <td>${escapeHtml(item.receiverPhone)}</td>
        <td>${escapeHtml(item.parcelDetails)}</td>
        <td>${escapeHtml(item.pickupLocationName)}</td>
      </tr>
    `,
    )
    .join('');

  const html = `
    <html>
      <head>
        <title>Consignment ${escapeHtml(payload.consignmentCode)}</title>
        <style>
          body {
            margin: 18px;
            font-family: Arial, sans-serif;
            color: #111827;
          }
          .header {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 12px;
            margin-bottom: 12px;
          }
          .header h1 {
            margin: 0 0 2px 0;
            font-size: 24px;
          }
          .header p {
            margin: 2px 0;
            font-size: 13px;
          }
          .meta {
            display: grid;
            grid-template-columns: 180px 1fr;
            row-gap: 6px;
            margin-bottom: 12px;
            padding: 10px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 13px;
          }
          .meta-label {
            color: #6b7280;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 6px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #f3f4f6;
            font-weight: 700;
          }
          .foot {
            margin-top: 10px;
            font-size: 12px;
            color: #4b5563;
          }
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Consignment Slip</h1>
            <p><strong>Code:</strong> ${escapeHtml(payload.consignmentCode)}</p>
          </div>
          <div style="text-align:right;">
            <p><strong>Date:</strong> ${escapeHtml(formatDate(payload.consignmentDate))}</p>
            <p><strong>Items:</strong> ${payload.items.length}</p>
          </div>
        </div>

        <div class="meta">
          <div class="meta-label">Source Branch</div>
          <div>${escapeHtml(payload.sourceBranchName)}</div>
          <div class="meta-label">Destination Branch</div>
          <div>${escapeHtml(payload.destinationBranchName)}</div>
          <div class="meta-label">Created By</div>
          <div>${escapeHtml(payload.createdByLabel)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tracking</th>
              <th>Booking</th>
              <th>Sender</th>
              <th>Sender Phone</th>
              <th>Receiver</th>
              <th>Receiver Phone</th>
              <th>Parcel Details</th>
              <th>Destination Location</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <p class="foot">Generated from processed parcel consignment workflow.</p>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();

  return true;
}
