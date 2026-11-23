import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, cashierSessions, parcels, payments } from '@/db/schemas';
import { PaymentMethod, CashierType, Payer, PaymentComponent } from '@/db/schemas/enums';
import { encodeHandoverSignature } from '@/shared/shipments/handover-signature';
import { collectReceiverPaymentAndDeliverSvc } from '@/server/features/payments/service';
import { captureReceiverHandoverSignature } from '@/server/features/payments/services/receiver-handover.service';
import { createPaymentCore } from '@/server/features/payments/services/payment-core.service';
import { createShelfPickupFixture } from './shelf-pickup-fixture';

const signatureImage = encodeHandoverSignature(
  [
    [
      { x: 15, y: 17 },
      { x: 75, y: 29 },
    ],
  ],
  200,
  80,
);

export async function createReceiverHandoverFixture() {
  const fixture = await createShelfPickupFixture();
  const scope = { companyId: fixture.companyId, branchId: fixture.branchId };
  await db
    .update(branches)
    .set({
      requireReceiverOtp: false,
      usePickupQueue: true,
      requireReceiverCashierSignature: true,
    })
    .where(eq(branches.id, fixture.branchId));
  await db.insert(cashierSessions).values(
    [fixture.actor, fixture.newPicker].map((cashierId) => ({
      cashierId,
      branchId: fixture.branchId,
      scheduledStartTime: new Date(),
      scheduledEndTime: new Date(Date.now() + 86_400_000),
      status: 'ACTIVE' as const,
    })),
  );

  const prepare = async (
    options: { storageOnly?: boolean; withStorage?: boolean; senderPaid?: boolean } = {},
  ) => {
    const parcel = await fixture.parcel();
    await db
      .update(parcels)
      .set({
        receivedAt: options.withStorage ? parcel.receivedAt : new Date(),
        ...(options.storageOnly ? { chargePsw: 0, plannedToBePaidPsw: 0 } : {}),
        ...(options.senderPaid ? { chargePsw: 2000 } : {}),
      })
      .where(eq(parcels.id, parcel.id));
    if (options.senderPaid)
      await db.transaction((tx) =>
        createPaymentCore(
          {
            ...scope,
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
    const ticket = await fixture.ticket(parcel.id);
    const input = {
      ...scope,
      parcelId: parcel.id,
      cashierUserId: fixture.actor,
      amountCedis: options.storageOnly ? 0 : 10,
      storageAmountCedis: options.withStorage ? 10 : 0,
      method: PaymentMethod.CASH,
      confirmedBy: fixture.oldPicker,
      handoverTarget: 'main' as const,
      expectedReceiverId: parcel.receiverId,
      requestSignature: true,
    };
    const result = await collectReceiverPaymentAndDeliverSvc(input);
    const action = {
      ...scope,
      parcelId: parcel.id,
      handoverId: result.handoverId!,
      actorId: fixture.newPicker,
    };
    return { parcel, ticket, input, action };
  };
  const sign = (action: Parameters<typeof captureReceiverHandoverSignature>[0]) =>
    captureReceiverHandoverSignature(action);
  return {
    ...fixture,
    scope,
    prepare,
    sign: (action: Omit<Parameters<typeof captureReceiverHandoverSignature>[0], 'signature'>) =>
      sign({ ...action, signature: { source: 'touchscreen', signatureImage } }),
    cleanup: async () => {
      await db.delete(payments).where(eq(payments.companyId, fixture.companyId));
      await db
        .delete(cashierSessions)
        .where(inArray(cashierSessions.cashierId, [fixture.actor, fixture.newPicker]));
      await fixture.cleanup();
    },
  };
}
