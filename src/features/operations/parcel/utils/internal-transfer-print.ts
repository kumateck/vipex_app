import type { ParcelInternalTransferDetails, ParcelInternalTransferRow } from '../api/parcel.api';
import { formatDateTime } from '@/lib/dates';
import { getPrintRuntime, printViaDesktop } from '@/features/printing/services/desktop-print';

function holderTypeLabel(value: number) {
  if (value === 0) return 'Main Branch';
  if (value === 1) return 'Location';
  if (value === 2) return 'Warehouse';
  return `Holder ${value}`;
}

function holderSummary(
  transfer: Pick<
    ParcelInternalTransferRow,
    | 'sourceHolderType'
    | 'sourceLocationName'
    | 'sourceWarehouseName'
    | 'destinationHolderType'
    | 'destinationLocationName'
    | 'destinationWarehouseName'
  >,
  side: 'source' | 'destination',
) {
  const type = side === 'source' ? transfer.sourceHolderType : transfer.destinationHolderType;
  const name =
    side === 'source'
      ? (transfer.sourceLocationName ?? transfer.sourceWarehouseName)
      : (transfer.destinationLocationName ?? transfer.destinationWarehouseName);

  return name ? `${holderTypeLabel(type)}: ${name}` : holderTypeLabel(type);
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

export async function printParcelInternalTransferSlip(details: ParcelInternalTransferDetails) {
  const itemRows = details.items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.trackingCode}</td>
          <td>${item.bookingCode}</td>
          <td>${item.receiverName ?? '-'}</td>
          <td>${item.receiverPhone ?? '-'}</td>
          <td>${item.parcelDetails}</td>
        </tr>
      `,
    )
    .join('');

  const html = `
    <html>
      <head>
        <title>Transfer Slip ${details.transfer.referenceNo ?? ''}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 24px;
            color: #111827;
          }
          h1, h2, p {
            margin: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .meta {
            display: grid;
            grid-template-columns: 180px 1fr;
            gap: 8px 12px;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .meta-label {
            color: #6b7280;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #f3f4f6;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-top: 40px;
          }
          .signature-box {
            padding-top: 36px;
            border-top: 1px solid #111827;
            font-size: 13px;
          }
          @media print {
            @page {
              size: A4 portrait;
              margin: 12mm;
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
            <h1>Parcel Internal Transfer Slip</h1>
            <p>Reference: ${details.transfer.referenceNo ?? '-'}</p>
          </div>
          <div>
            <p><strong>Status:</strong> ${details.transfer.status === 0 ? 'Pending' : details.transfer.status === 1 ? 'Acknowledged' : 'Cancelled'}</p>
            <p><strong>Transferred:</strong> ${formatDate(details.transfer.transferredAt)}</p>
          </div>
        </div>

        <div class="meta">
          <div class="meta-label">Branch</div>
          <div>${details.transfer.branchName ?? '-'}</div>
          <div class="meta-label">From</div>
          <div>${holderSummary(details.transfer, 'source')}</div>
          <div class="meta-label">To</div>
          <div>${holderSummary(details.transfer, 'destination')}</div>
          <div class="meta-label">Transferred By</div>
          <div>${details.transfer.transferredByName ?? '-'}</div>
          <div class="meta-label">Acknowledged By</div>
          <div>${details.transfer.acknowledgedByName ?? '-'}</div>
          <div class="meta-label">Acknowledged At</div>
          <div>${formatDate(details.transfer.acknowledgedAt)}</div>
          <div class="meta-label">Notes</div>
          <div>${details.transfer.notes ?? '-'}</div>
        </div>

        <h2 style="margin-bottom: 12px;">Parcel List (${details.items.length})</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tracking</th>
              <th>Booking</th>
              <th>Receiver</th>
              <th>Telephone</th>
              <th>Parcel Details</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="signatures">
          <div class="signature-box">Transferred By Signature</div>
          <div class="signature-box">Received By Signature</div>
        </div>
      </body>
    </html>
  `;

  if (getPrintRuntime() === 'desktop') {
    const result = await printViaDesktop({
      html,
      layout: 'report-a4',
      title: `transfer-${details.transfer.referenceNo ?? 'slip'}`,
    });
    if (result.ok) return;
  }

  const printWindow = window.open('', '_blank', 'width=900,height=700,noopener,noreferrer');
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
