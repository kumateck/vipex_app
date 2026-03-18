import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import {
  pendingBookings,
  bookings,
  parcels,
  generatedReceipts,
  ParcelStatus,
  customers,
  PendingBookingStatus,
  ReceiptType,
} from '../../../db/schemas';
import type { PaymentResponsibility as PaymentResponsibilityType } from '../../../db/schemas/enums';

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type PendingBookingReceipts = {
  paymentReceipt: {
    receiptNumber: string;
    content: string;
    receiptData: { amount: string; method: number };
  };
  trackingSticker: {
    trackingCode: string;
    qrCode: string;
    content: string;
    stickerData: {
      trackingCode: string;
      sender: CreatePendingBookingInput['bookingData']['senderInfo'];
      receiver: CreatePendingBookingInput['bookingData']['receiverInfo'];
    };
  };
};

export interface CreatePendingBookingInput {
  companyId: string;
  branchId: string;
  bookingData: {
    senderInfo: {
      fullname: string;
      telephone?: string;
      telephone2?: string;
      address?: string;
      email?: string;
    };
    receiverInfo: {
      fullname: string;
      telephone?: string;
      telephone2?: string;
      address?: string;
      email?: string;
    };
    parcelDetails: {
      details: string;
      content: string;
      value: string; // in cedis
    };
    destinationBranchId: string;
    deliveryMode: 0 | 1; // OFFICE | DOORSTEP
  };
  paymentResponsibility: PaymentResponsibilityType;
  senderAmount?: string; // in cedis
  recipientAmount?: string; // in cedis
  attendantId: string;
  expiresAt?: Date; // Auto-cancel if not confirmed
}

export interface ConfirmPendingBookingInput {
  pendingBookingId: string;
  cashierId: string;
  paymentMethod: 0 | 1 | 2 | 3; // CASH | MTN | TELECEL | AIRTEL
  receivedAmount: string; // in cedis
  cashierSessionId: string;
}

/**
 * Create a pending booking from attendant input
 */
export async function createPendingBooking(input: CreatePendingBookingInput) {
  const {
    companyId,
    branchId,
    bookingData,
    paymentResponsibility,
    senderAmount,
    recipientAmount,
    attendantId,
    expiresAt,
  } = input;

  // Set expiry to 30 minutes from now if not provided
  const expiryTime = expiresAt || new Date(Date.now() + 30 * 60 * 1000);

  // Create pending booking
  const [pendingBooking] = await db
    .insert(pendingBookings)
    .values({
      companyId,
      branchId,
      bookingData,
      paymentResponsibility,
      senderAmountPsw: senderAmount ? Math.round(parseFloat(senderAmount) * 100) : 0,
      recipientAmountPsw: recipientAmount ? Math.round(parseFloat(recipientAmount) * 100) : 0,
      attendantId,
      expiresAt: expiryTime,
      status: PendingBookingStatus.PENDING,
    })
    .returning();

  return pendingBooking;
}

/**
 * Get pending bookings for a branch
 */
export async function getPendingBookings(
  branchId: string,
  options: {
    status?: PendingBookingStatus;
    attendantId?: string;
    limit?: number;
    offset?: number;
  } = {},
) {
  const { status, attendantId, limit = 25, offset = 0 } = options;

  const conditions = [
    eq(pendingBookings.branchId, branchId),
    eq(pendingBookings.status, status || PendingBookingStatus.PENDING),
  ];

  if (attendantId) {
    conditions.push(eq(pendingBookings.attendantId, attendantId));
  }

  const [countRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(pendingBookings)
    .where(and(...conditions));
  const totalRecords = Number(countRow?.c ?? 0);

  const data = await db
    .select()
    .from(pendingBookings)
    .where(and(...conditions))
    .orderBy(pendingBookings.createdAt)
    .limit(limit)
    .offset(offset);

  return { data, totalRecords };
}

/**
 * Get single pending booking by ID
 */
export async function getPendingBooking(id: string) {
  const [pendingBooking] = await db
    .select()
    .from(pendingBookings)
    .where(eq(pendingBookings.id, id))
    .limit(1);

  return pendingBooking;
}

/**
 * Confirm pending booking and create actual booking + receipts
 */
export async function confirmPendingBooking(input: ConfirmPendingBookingInput): Promise<{
  bookingId: string;
  parcelId: string;
  receipts: PendingBookingReceipts;
}> {
  const { pendingBookingId, cashierId, paymentMethod, receivedAmount, cashierSessionId } = input;

  // Get pending booking
  const pendingBooking = await getPendingBooking(pendingBookingId);

  if (!pendingBooking) {
    throw new Error('Pending booking not found');
  }

  if (pendingBooking.status !== PendingBookingStatus.PENDING) {
    throw new Error('Pending booking is not in pending status');
  }

  if (new Date() > pendingBooking.expiresAt) {
    // Auto-expire
    await db
      .update(pendingBookings)
      .set({
        status: PendingBookingStatus.EXPIRED,
        cancelledAt: new Date(),
      })
      .where(eq(pendingBookings.id, pendingBookingId));

    throw new Error('Pending booking has expired');
  }

  const bookingData = pendingBooking.bookingData as CreatePendingBookingInput['bookingData'];
  const companyId = pendingBooking.companyId;
  const branchId = pendingBooking.branchId;

  // Start transaction
  return await db.transaction(async (tx: DbTransaction) => {
    // 1. Get or create sender customer
    const [sender] = await tx
      .insert(customers)
      .values({
        companyId,
        fullname: bookingData.senderInfo.fullname,
        telephone: bookingData.senderInfo.telephone,
        telephone2: bookingData.senderInfo.telephone2,
        address: bookingData.senderInfo.address,
        email: bookingData.senderInfo.email,
        createdBy: cashierId,
      })
      .onConflictDoUpdate({
        target: customers.telephone,
        set: {
          fullname: bookingData.senderInfo.fullname,
          telephone2: bookingData.senderInfo.telephone2,
          address: bookingData.senderInfo.address,
          email: bookingData.senderInfo.email,
          updatedAt: new Date(),
        },
      })
      .returning();

    // 2. Get or create receiver customer
    const [receiver] = await tx
      .insert(customers)
      .values({
        companyId,
        fullname: bookingData.receiverInfo.fullname,
        telephone: bookingData.receiverInfo.telephone,
        telephone2: bookingData.receiverInfo.telephone2,
        address: bookingData.receiverInfo.address,
        email: bookingData.receiverInfo.email,
        createdBy: cashierId,
      })
      .onConflictDoUpdate({
        target: customers.telephone,
        set: {
          fullname: bookingData.receiverInfo.fullname,
          telephone2: bookingData.receiverInfo.telephone2,
          address: bookingData.receiverInfo.address,
          email: bookingData.receiverInfo.email,
          updatedAt: new Date(),
        },
      })
      .returning();

    const defaultStatus = ParcelStatus.CREATED;

    // 4. Create booking
    const [booking] = await tx
      .insert(bookings)
      .values({
        companyId,
        senderId: sender.id,
        sourceId: branchId,
        status: defaultStatus,
        createdBy: cashierId,
        cashierSessionId,
      })
      .returning();

    // 5. Create parcel
    const trackingCode = await generateTrackingCode(companyId);
    const bookingCode = await generateBookingCode(tx, companyId);
    const chargePsw =
      Number(pendingBooking.senderAmountPsw ?? 0) + Number(pendingBooking.recipientAmountPsw ?? 0);

    const [parcel] = await tx
      .insert(parcels)
      .values({
        companyId,
        sourceId: branchId,
        destinationId: bookingData.destinationBranchId,
        bookingId: booking.id,
        bookingCode,
        trackingCode,
        senderId: sender.id,
        receiverId: receiver.id,
        status: defaultStatus,
        parcelDetails: bookingData.parcelDetails.details,
        parcelContent: bookingData.parcelDetails.content,
        parcelValuePsw: parseFloat(bookingData.parcelDetails.value) * 100,
        chargePsw,
        plannedToBePaidPsw: Number(pendingBooking.recipientAmountPsw ?? 0),
        method: paymentMethod,
        createdBy: cashierId,
        cashierSessionId,
      })
      .returning();

    // 6. Generate receipts (simplified for now)
    const receiptNumber = await generateReceiptNumber(companyId, 'PAYMENT');
    const receipts = {
      paymentReceipt: {
        receiptNumber,
        content: `<html><body><h1>Payment Receipt</h1><p>Amount: GHS ${receivedAmount}</p><p>Receipt: ${receiptNumber}</p></body></html>`,
        receiptData: { amount: receivedAmount, method: paymentMethod },
      },
      trackingSticker: {
        trackingCode,
        qrCode: `QR-${trackingCode}`,
        content: `<html><body><h1>Tracking: ${trackingCode}</h1><p>From: ${bookingData.senderInfo.fullname}</p><p>To: ${bookingData.receiverInfo.fullname}</p></body></html>`,
        stickerData: {
          trackingCode,
          sender: bookingData.senderInfo,
          receiver: bookingData.receiverInfo,
        },
      },
    };

    // 7. Save generated receipts
    await tx.insert(generatedReceipts).values([
      {
        companyId,
        type: ReceiptType.PAYMENT,
        referenceId: parcel.id,
        referenceType: 'parcel',
        receiptNumber,
        content: receipts.paymentReceipt.content,
        metadata: receipts.paymentReceipt.receiptData,
        createdBy: cashierId,
      },
      {
        companyId,
        type: ReceiptType.TRACKING_STICKER,
        referenceId: parcel.id,
        referenceType: 'parcel',
        receiptNumber: `TRACK-${trackingCode}`,
        content: receipts.trackingSticker.content,
        metadata: receipts.trackingSticker.stickerData,
        createdBy: cashierId,
      },
    ]);

    // 8. Update pending booking status
    await tx
      .update(pendingBookings)
      .set({
        status: PendingBookingStatus.CONFIRMED,
        confirmedAt: new Date(),
      })
      .where(eq(pendingBookings.id, pendingBookingId));

    return {
      bookingId: booking.id,
      parcelId: parcel.id,
      receipts,
    };
  });
}

/**
 * Cancel pending booking
 */
export async function cancelPendingBooking(
  pendingBookingId: string,
  cancelledBy: string,
  reason?: string,
) {
  await db
    .update(pendingBookings)
    .set({
      status: PendingBookingStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledBy,
      cancelReason: reason,
    })
    .where(eq(pendingBookings.id, pendingBookingId));
}

/**
 * Cleanup expired pending bookings
 */
export async function cleanupExpiredPendingBookings() {
  await db
    .update(pendingBookings)
    .set({
      status: PendingBookingStatus.EXPIRED,
      cancelledAt: new Date(),
    })
    .where(
      and(
        eq(pendingBookings.status, PendingBookingStatus.PENDING),
        lte(pendingBookings.expiresAt, new Date()),
      ),
    );
}

// Helper functions
async function generateTrackingCode(companyId: string): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VIP${companyId.slice(0, 4)}${timestamp}${random}`;
}

async function generateBookingCode(tx: DbTransaction, companyId: string): Promise<string> {
  // Generate booking code like B20240115001
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  // Get count for today
  const today = new Date(dateStr);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [result] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(parcels)
    .where(
      and(
        eq(parcels.companyId, companyId),
        gte(parcels.createdAt, today),
        lte(parcels.createdAt, tomorrow),
      ),
    )
    .limit(1);

  const sequence = (result?.count || 0) + 1;
  return `B${dateStr}${sequence.toString().padStart(3, '0')}`;
}

async function generateReceiptNumber(companyId: string, type: string): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${type.substring(0, 3)}${companyId.slice(0, 4)}${timestamp}${random}`;
}
