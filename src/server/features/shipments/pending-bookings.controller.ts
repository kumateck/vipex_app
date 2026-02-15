import {
  createPendingBooking,
  getPendingBookings,
  getPendingBooking,
  confirmPendingBooking,
  cancelPendingBooking,
  cleanupExpiredPendingBookings,
  type CreatePendingBookingInput,
  type ConfirmPendingBookingInput,
} from './pending-bookings.service';

export interface ListPendingBookingsQuery {
  branchId: string;
  status?: number;
  attendantId?: string;
  limit?: number;
  after?: string;
}

export async function listPendingBookingsCtrl(query: ListPendingBookingsQuery) {
  const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;

  const pendingBookings = await getPendingBookings(query.branchId, {
    status: query.status as any,
    attendantId: query.attendantId,
    limit,
    after: query.after,
  });

  return {
    data: pendingBookings.map((pb) => ({
      id: pb.id,
      companyId: pb.companyId,
      branchId: pb.branchId,
      bookingData: pb.bookingData,
      paymentResponsibility: pb.paymentResponsibility,
      senderAmount: pb.senderAmountPsw ? (Number(pb.senderAmountPsw) / 100).toFixed(2) : '0.00',
      recipientAmount: pb.recipientAmountPsw
        ? (Number(pb.recipientAmountPsw) / 100).toFixed(2)
        : '0.00',
      attendantId: pb.attendantId,
      status: pb.status,
      createdAt: pb.createdAt,
      expiresAt: pb.expiresAt,
      confirmedAt: pb.confirmedAt,
    })),
    pagination: {
      limit,
      hasMore: pendingBookings.length === limit,
    },
  };
}

export async function getPendingBookingCtrl(id: string) {
  const pendingBooking = await getPendingBooking(id);

  if (!pendingBooking) {
    throw new Error('Pending booking not found');
  }

  return {
    id: pendingBooking.id,
    companyId: pendingBooking.companyId,
    branchId: pendingBooking.branchId,
    bookingData: pendingBooking.bookingData,
    paymentResponsibility: pendingBooking.paymentResponsibility,
    senderAmount: pendingBooking.senderAmountPsw
      ? (Number(pendingBooking.senderAmountPsw) / 100).toFixed(2)
      : '0.00',
    recipientAmount: pendingBooking.recipientAmountPsw
      ? (Number(pendingBooking.recipientAmountPsw) / 100).toFixed(2)
      : '0.00',
    attendantId: pendingBooking.attendantId,
    status: pendingBooking.status,
    createdAt: pendingBooking.createdAt,
    expiresAt: pendingBooking.expiresAt,
    confirmedAt: pendingBooking.confirmedAt,
  };
}

export async function createPendingBookingCtrl(input: CreatePendingBookingInput) {
  const pendingBooking = await createPendingBooking(input);

  if (!pendingBooking) {
    throw new Error('Failed to create pending booking');
  }

  return {
    id: pendingBooking.id,
    companyId: pendingBooking.companyId,
    branchId: pendingBooking.branchId,
    bookingData: pendingBooking.bookingData,
    paymentResponsibility: pendingBooking.paymentResponsibility,
    senderAmount: pendingBooking.senderAmountPsw
      ? (Number(pendingBooking.senderAmountPsw) / 100).toFixed(2)
      : '0.00',
    recipientAmount: pendingBooking.recipientAmountPsw
      ? (Number(pendingBooking.recipientAmountPsw) / 100).toFixed(2)
      : '0.00',
    attendantId: pendingBooking.attendantId,
    status: pendingBooking.status,
    createdAt: pendingBooking.createdAt,
    expiresAt: pendingBooking.expiresAt,
    confirmedAt: pendingBooking.confirmedAt,
  };
}

export async function confirmPendingBookingCtrl(input: ConfirmPendingBookingInput) {
  const result = await confirmPendingBooking(input);

  return {
    bookingId: result.bookingId,
    parcelId: result.parcelId,
    receipts: result.receipts,
    message: 'Booking confirmed and receipts generated successfully',
  };
}

export async function cancelPendingBookingCtrl(id: string, cancelledBy: string, reason?: string) {
  await cancelPendingBooking(id, cancelledBy, reason);

  return {
    success: true,
    message: 'Pending booking cancelled successfully',
  };
}

export async function cleanupExpiredPendingBookingsCtrl() {
  await cleanupExpiredPendingBookings();

  return {
    success: true,
    message: 'Expired pending bookings cleaned up successfully',
  };
}
