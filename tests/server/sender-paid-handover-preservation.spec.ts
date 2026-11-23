import { afterAll, beforeAll, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, parcels, payments, taxJournalItems } from '@/db/schemas';
import {
  CashierType,
  ParcelStatus,
  Payer,
  PaymentComponent,
  PaymentMethod,
} from '@/db/schemas/enums';
import { createPaymentCore } from '@/server/features/payments/services/payment-core.service';
import { confirmOfficePickupSvc } from '@/server/features/shipments/parcel-services/confirm-office-pickup';
import { listParcelsRepo } from '@/server/features/shipments/parcel-repositories/parcel-list.repository';
import { encodeHandoverSignature } from '@/shared/shipments/handover-signature';
import { createReceiverHandoverFixture } from '../utils/receiver-handover-fixture';

let fixture: Awaited<ReturnType<typeof createReceiverHandoverFixture>>;
beforeAll(async () => {
  fixture = await createReceiverHandoverFixture();
  await db
    .update(branches)
    .set({ requirePickupOtp: false })
    .where(eq(branches.id, fixture.branchId));
});
afterAll(async () => {
  if (fixture) await fixture.cleanup();
});

test('another cashier confirms a fully sender-paid parcel without changing payment or tax records', async () => {
  const parcel = await fixture.parcel();
  await db.update(parcels).set({ receivedAt: new Date() }).where(eq(parcels.id, parcel.id));
  await db.transaction((tx) =>
    createPaymentCore(
      {
        ...fixture.scope,
        parcelId: parcel.id,
        cashierUserId: fixture.actor,
        amountCedis: 10,
        component: PaymentComponent.PRINCIPAL,
        payer: Payer.SENDER,
        cashierType: CashierType.SENDING,
        method: PaymentMethod.CASH,
      },
      tx,
    ),
  );
  await fixture.ticket(parcel.id);
  const beforePayments = await db.select().from(payments).where(eq(payments.parcelId, parcel.id));
  const beforeTax = await db
    .select()
    .from(taxJournalItems)
    .where(eq(taxJournalItems.companyId, fixture.companyId));
  const eligible = await listParcelsRepo({
    parcelId: parcel.id,
    companyId: fixture.companyId,
    destinationId: fixture.branchId,
    status: ParcelStatus.AWAITING_PICKUP,
    cashierCollectionRequired: false,
    offset: 0,
    limit: 20,
  });
  expect(eligible.data.map(({ id }) => id)).toContain(parcel.id);
  await confirmOfficePickupSvc({
    ...fixture.scope,
    parcelId: parcel.id,
    locationId: fixture.locationId,
    actorUserId: fixture.newPicker,
    confirmedBy: fixture.oldPicker,
    handoverTarget: 'main',
    signatureImage: encodeHandoverSignature(
      [
        [
          { x: 12, y: 30 },
          { x: 140, y: 100 },
        ],
      ],
      300,
      240,
    ),
    expectedMainReceiverId: parcel.receiverId,
    expectedSecondReceiverId: null,
    secondReceiverId: null,
    cardId: null,
    cardNumber: null,
    secondCardId: null,
    secondCardNumber: null,
  });
  expect(await db.select().from(payments).where(eq(payments.parcelId, parcel.id))).toEqual(
    beforePayments,
  );
  expect(
    await db.select().from(taxJournalItems).where(eq(taxJournalItems.companyId, fixture.companyId)),
  ).toEqual(beforeTax);
  const [saved] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
  expect(saved!.status).toBe(ParcelStatus.DELIVERED_BY_OFFICE);
  expect(saved!.deliveryConfirmationSnapshot!.paymentIds).toEqual([]);
  expect(saved!.plannedToBePaidPsw).toBe(0);
});
