import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  bookings,
  parcels,
  payments,
  customerCreditTransactions,
  PaymentComponent,
  Payer,
  CashierType,
  PaymentMethod,
  users,
  branches,
  CustomerCreditSourceType,
  CustomerCreditTransactionType,
} from '@/db/schemas';
import { sanitizeString } from '@/lib/utils';
import { generateBookingCode, generateTrackingCode } from '@/server/utils/codegen';

export type CreatedParcelRef = { id: string; trackingCode: string; bookingCode: string };
export type CreatedPaymentRef = { id: string };

export type CreateBookingWithParcelsInput = {
  // booking header
  senderId: string;
  companyId: string;
  sourceId: string;
  sourceLocationId?: string | null;
  status: number;
  createdBy: string;
  cashierSessionId?: string | null;

  // parcels to create
  // bookingCode?: string | null; // if absent, will be generated once and applied to all parcels
  parcels: Array<{
    destinationId: string;
    pickupLocationId?: string | null;
    receiverId: string;
    status: number; // initial parcel status
    parcelDetails: string;
    parcelContent: string;
    parcelValuePsw?: number; // pre-converted pesewas; optional
    chargePsw?: number; // pre-converted pesewas; optional
    plannedToBePaidPsw?: number; // pre-converted pesewas; optional
    method: PaymentMethod; // the method captured for this parcel context
    trackingCode?: string | null; // if absent, will be generated
    // optional sender payment at booking-time (component=PRINCIPAL)
    senderPaymentPsw?: number; // pesewas, optional
    senderPaymentMethod?: PaymentMethod; // fallback to parcel.method if not provided
    cashierUserId: string; // sending cashier user id for this parcel
    processedBy?: string | null;
    branchId: string; // branch taking the cash
    callSender?: boolean; // sender must be called before parcel is given to receiver
  }>;
};

export type CreateBookingWithParcelsOutput = {
  bookingId: string;
  bookingCode?: string;
  parcels: CreatedParcelRef[];
  payments: CreatedPaymentRef[];
};

function getErrorCode(error: unknown, depth = 0): string | undefined {
  if (!error || typeof error !== 'object' || depth > 6) return undefined;
  const err = error as { code?: unknown; cause?: unknown };
  if (typeof err.code === 'string' && err.code.length > 0) return err.code;
  return getErrorCode(err.cause, depth + 1);
}

// Simple, readable booking code generator: BK-YYMMDD-XXXXX
// export function generateBookingCode(now: Date): string {
//   const yy = String(now.getFullYear()).slice(-2);
//   const mm = String(now.getMonth() + 1).padStart(2, '0');
//   const dd = String(now.getDate()).padStart(2, '0');
//   const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
//   return `BK-${yy}${mm}${dd}-${rand}`;
// }

// // Tracking code generator: TRK-XXXXXXXXXX (uppercase base36)
// export function generateTrackingCode(): string {
//   return `TRK-${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
// }

// Fetch authenticated cashier's branch name (used for booking code initial)
async function getCashierBranchName(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
): Promise<string> {
  const uAlias = users;
  const bAlias = branches;
  const [row] = await tx
    .select({ branchName: bAlias.name })
    .from(uAlias)
    .innerJoin(bAlias, eq(bAlias.id, uAlias.branchId))
    .where(eq(uAlias.id, userId))
    .limit(1);
  if (!row || !row.branchName) {
    // Fallback initial handled by generator; return empty string
    return '';
  }
  return row.branchName;
}

async function isTrackingTaken(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  companyId: string,
  code: string,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: parcels.id })
    .from(parcels)
    .where(sql`${parcels.companyId} = ${companyId} AND ${parcels.trackingCode} = ${code}`)
    .limit(1);
  return !!row;
}

async function createUniqueTrackingCode(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  companyId: string,
  maxAttempts = 6,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateTrackingCode();
    const taken = await isTrackingTaken(tx, companyId, code);
    if (!taken) return code;
  }
  // Fallback: append a tiny suffix if collisions persist (extremely unlikely)
  return `${generateTrackingCode()}X`;
}

export async function createBookingWithParcelsAndPaymentsRepo(
  input: CreateBookingWithParcelsInput,
  taxComputer: (principalPsw: number) => {
    principal: number;
    net: number;
    vat: number;
    getfund: number;
    nhil: number;
    covid: number;
    totalTax: number;
  },
): Promise<CreateBookingWithParcelsOutput> {
  return db.transaction(async (tx) => {
    // Get branch name from authenticated cashier (createdBy)
    const branchName = await getCashierBranchName(tx, input.createdBy);

    const bookingCreatedAt = new Date();
    // Generate or use provided booking code

    const [b] = await tx
      .insert(bookings)
      .values({
        companyId: input.companyId,
        sourceId: input.sourceId,
        createdBy: input.createdBy,
        cashierSessionId: input.cashierSessionId ?? null,
        // createdAt/updatedAt default at DB
      })
      .returning({ id: bookings?.id });

    const createdParcels: CreatedParcelRef[] = [];
    const createdPayments: CreatedPaymentRef[] = [];

    for (const p of input.parcels) {
      const tracking = await createUniqueTrackingCode(tx, input.companyId);

      const code = generateBookingCode(branchName, bookingCreatedAt);

      const baseParcelInsert = {
        companyId: input.companyId,
        sourceId: input.sourceId,
        destinationId: p.destinationId,
        pickupLocationId: p.pickupLocationId ?? null,
        bookingId: sanitizeString(b?.id),
        bookingCode: code,
        trackingCode: tracking,
        senderId: input.senderId,
        receiverId: p.receiverId,
        status: p.status,
        parcelDetails: p.parcelDetails,
        parcelContent: p.parcelContent,
        parcelValuePsw: p.parcelValuePsw ?? 0,
        chargePsw: p.chargePsw ?? 0,
        plannedToBePaidPsw: p.plannedToBePaidPsw ?? 0,
        method: p.method,
        callSender: p.callSender ?? false,
        createdBy: input.createdBy,
        processedBy: p.processedBy ?? null,
        cashierSessionId: input.cashierSessionId ?? null,
      };

      let parcelRow: { id: string; trackingCode: string } | undefined;

      try {
        [parcelRow] = await tx
          .insert(parcels)
          .values({
            ...baseParcelInsert,
            sourceLocationId: input.sourceLocationId ?? null,
          })
          .returning({ id: parcels.id, trackingCode: parcels.trackingCode });
      } catch (error) {
        if (getErrorCode(error) !== '42703') throw error;

        [parcelRow] = await tx
          .insert(parcels)
          .values(baseParcelInsert)
          .returning({ id: parcels.id, trackingCode: parcels.trackingCode });
      }

      createdParcels.push({
        id: sanitizeString(parcelRow?.id),
        trackingCode: sanitizeString(parcelRow?.trackingCode),
        bookingCode: code,
      });

      if (p.senderPaymentPsw && p.senderPaymentPsw > 0) {
        const tax = taxComputer(p.senderPaymentPsw);
        const [pay] = await tx
          .insert(payments)
          .values({
            companyId: input.companyId,
            branchId: p.branchId,
            parcelId: sanitizeString(parcelRow?.id),
            component: PaymentComponent.PRINCIPAL,
            payer: Payer.SENDER,
            cashierType: CashierType.SENDING,
            method: p.senderPaymentMethod ?? p.method,
            cashierUserId: p.cashierUserId,
            grossAmountPsw: tax.principal,
            netAmountPsw: tax.net,
            vatPsw: tax.vat,
            getfundPsw: tax.getfund,
            nhilPsw: tax.nhil,
            covidPsw: tax.covid,
            taxTotalPsw: tax.totalTax,
            receivedAt: new Date(),
            notes: null,
            receiptNo: null,
          })
          .returning({ id: payments.id });
        createdPayments.push({ id: sanitizeString(pay?.id) });
      }

      const shouldPostSenderCredit =
        p.method === PaymentMethod.CREDIT &&
        (!p.senderPaymentPsw || p.senderPaymentPsw <= 0) &&
        (p.plannedToBePaidPsw ?? 0) <= 0 &&
        (p.chargePsw ?? 0) > 0;

      if (shouldPostSenderCredit) {
        await tx.insert(customerCreditTransactions).values({
          companyId: input.companyId,
          customerId: input.senderId,
          sourceType: CustomerCreditSourceType.PARCEL,
          transactionType: CustomerCreditTransactionType.CHARGE,
          referenceId: sanitizeString(parcelRow?.id),
          signedAmountPsw: Number(p.chargePsw ?? 0),
          notes: 'Parcel booking posted on customer credit',
          createdBy: input.createdBy,
        });
      }
    }

    return {
      bookingId: sanitizeString(b?.id),
      parcels: createdParcels,
      payments: createdPayments,
    };
  });
}
