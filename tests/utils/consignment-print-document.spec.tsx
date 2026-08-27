import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ProcessedParcel } from '@/features/operations/parcel/api/parcel.api';
import { ConsignmentPrintDocument } from '@/features/operations/parcel/components/parcel-processed-consignment/consignment-print-document';

const PARCEL: ProcessedParcel = {
  id: 'parcel-1',
  senderId: 'sender-1',
  receiverId: 'receiver-1',
  destinationId: 'branch-1',
  destinationName: 'Kumasi Main',
  pickupLocationId: 'location-1',
  bookingCode: 'KA123',
  trackingCode: 'TRACK123',
  parcelDetails: 'One box',
  senderName: 'Ama Sender',
  senderPhone: '0200000001',
  receiverName: 'Kojo Receiver',
  receiverPhone: '0200000002',
  chargePsw: 3_000,
  plannedToBePaidPsw: 1_000,
  status: 0,
  createdAt: '2026-08-26T10:00:00.000Z',
};

describe('consignment print document', () => {
  test('prints the destination branch in the report header', () => {
    const html = renderToStaticMarkup(
      <ConsignmentPrintDocument payload={{ consignmentCode: 'CON-001', items: [PARCEL] }} />,
    );

    expect(html).toContain('Destination Branch:');
    expect(html).toContain('Kumasi Main');
  });
});
