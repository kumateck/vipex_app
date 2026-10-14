import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, deliveries, parcels } from '@/db/schemas';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  returnHomeDeliveryToPickupSvc,
  doorToDoorFinalizeAtOfficeSvc,
} from '@/server/features/deliveries';
import { doorToDoorRiderGivenToCustomerSvc } from '@/server/features/deliveries/rider-handover.service';
import { reprocessRiderReturnForPickupSvc } from '@/server/features/deliveries/rider-return-processing.service';
import { getDeliveryByParcelRepo } from '@/server/features/deliveries/repository';
import { getParcelRepo } from '@/server/features/shipments/parcels.repository';
import { getParcelPaymentSettlement } from '@/server/features/shipments/parcel-payment-settlement';
import { listPaymentsForParcelRepo } from '@/server/features/payments/repository';
import { createRiderReturnFeeFixture } from '../utils/rider-return-fee-fixture';

const allPermissions = [
  PermissionKeys.CanMarkDoorstepCalled,
  PermissionKeys.CanDispatchForDelivery,
  PermissionKeys.CanCompleteDoorstepDelivery,
];
describe('home delivery return to main office for pickup', () => {
  let fixture: Awaited<ReturnType<typeof createRiderReturnFeeFixture>>;
  beforeAll(async () => {
    fixture = await createRiderReturnFeeFixture();
  });
  afterAll(async () => {
    await fixture?.cleanup();
  });
  const staffInput = (parcelId: string) => ({
    parcelId,
    companyId: fixture.companyId,
    branchId: fixture.branchId,
    actorUserId: fixture.actor,
    permissions: allPermissions,
  });
  const handover = (parcelId: string) =>
    doorToDoorRiderGivenToCustomerSvc({
      parcelId,
      riderUserId: fixture.oldPicker,
      signatureImage: 'data:image/png;base64,mistaken',
      deliveryFeeAmountCedis: '15.00',
    });

  test('cashier return nullifies the delivery fee and preserves payments and audit evidence', async () => {
    const parcelId = await fixture.parcel(2500, 1000);
    await handover(parcelId);
    const originalPayments = await listPaymentsForParcelRepo(parcelId);
    await returnHomeDeliveryToPickupSvc({
      ...staffInput(parcelId),
      permissions: [PermissionKeys.CanCompleteDoorstepDelivery],
    });
    expect(await getParcelRepo(parcelId)).toMatchObject({
      status: ParcelStatus.AWAITING_PICKUP,
      confirmedBy: null,
      confirmedAt: null,
    });
    expect(await getDeliveryByParcelRepo(parcelId)).toMatchObject({
      status: 'RETURNED_TO_OFFICE',
      chargePsw: 0,
      dropoffAddress: 'Customer home',
      riderUserId: fixture.oldPicker,
      riderCompletedAt: null,
      confirmedBy: null,
      confirmedAt: null,
      signatureImage: null,
    });
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.parcelId, parcelId));
    expect(delivery).toMatchObject({
      riderCollectedPrincipalPsw: 0,
      riderCollectedDeliveryFeePsw: 0,
      riderCollectionRecordedAt: null,
    });
    expect(await listPaymentsForParcelRepo(parcelId)).toEqual(originalPayments);
    expect((await getParcelPaymentSettlement(parcelId)).requiredDeliveryFeePsw).toBe(0);
    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityId, parcelId), eq(auditLogs.actorUserId, fixture.actor)));
    expect(audit?.metadata).toMatchObject({
      previous: {
        status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
        confirmedBy: fixture.oldPicker,
        delivery: {
          chargePsw: 2500,
          riderCollectedDeliveryFeePsw: 1500,
          signatureImage: 'data:image/png;base64,mistaken',
        },
      },
    });
    await expect(returnHomeDeliveryToPickupSvc(staffInput(parcelId))).rejects.toThrow(
      'not eligible',
    );
    await expect(
      doorToDoorFinalizeAtOfficeSvc({
        parcelId,
        cashierUserId: fixture.actor,
        companyId: fixture.companyId,
        branchId: fixture.branchId,
        method: PaymentMethod.CASH,
      }),
    ).rejects.toThrow('not ready');
  });

  test('to-be-paid principal remains outstanding for receiver cashier collection at pickup', async () => {
    const parcelId = await fixture.parcel();
    await db
      .update(parcels)
      .set({ chargePsw: 8000, plannedToBePaidPsw: 8000 })
      .where(eq(parcels.id, parcelId));
    await handover(parcelId);
    await returnHomeDeliveryToPickupSvc(staffInput(parcelId));
    expect(await getParcelRepo(parcelId)).toMatchObject({
      status: ParcelStatus.AWAITING_PICKUP,
      chargePsw: 8000,
      plannedToBePaidPsw: 8000,
    });
    expect(await getParcelPaymentSettlement(parcelId)).toMatchObject({
      requiredPrincipalPsw: 8000,
      requiredDeliveryFeePsw: 0,
      paidPrincipalPsw: 0,
      outstandingPsw: 8000,
    });
    expect(await listPaymentsForParcelRepo(parcelId)).toHaveLength(0);
  });

  test('address collection, dispatch and legacy rider returns use the same pickup transition', async () => {
    for (const status of [
      ParcelStatus.HOME_DELIVERY_REQUESTED,
      ParcelStatus.ADDRESS_COLLECTED,
      ParcelStatus.RETURNED_TO_OFFICE,
    ]) {
      const parcelId = await fixture.parcel();
      await db.update(parcels).set({ status }).where(eq(parcels.id, parcelId));
      if (status === ParcelStatus.HOME_DELIVERY_REQUESTED) {
        await db.delete(deliveries).where(eq(deliveries.parcelId, parcelId));
      } else {
        await db
          .update(deliveries)
          .set({
            status:
              status === ParcelStatus.ADDRESS_COLLECTED
                ? 'ADDRESS_COLLECTED'
                : 'RETURNED_TO_OFFICE',
            returnedAt: status === ParcelStatus.RETURNED_TO_OFFICE ? new Date() : null,
          })
          .where(eq(deliveries.parcelId, parcelId));
      }
      if (status === ParcelStatus.RETURNED_TO_OFFICE)
        await reprocessRiderReturnForPickupSvc(staffInput(parcelId));
      else await returnHomeDeliveryToPickupSvc(staffInput(parcelId));
      expect((await getParcelRepo(parcelId))?.status).toBe(ParcelStatus.AWAITING_PICKUP);
      if (status !== ParcelStatus.HOME_DELIVERY_REQUESTED) {
        expect((await getDeliveryByParcelRepo(parcelId))?.chargePsw).toBe(0);
      }
    }
  });

  test('wrong scope, rider actor, missing stage permission and finalized deliveries cannot change state', async () => {
    const parcelId = await fixture.parcel();
    await handover(parcelId);
    await expect(
      returnHomeDeliveryToPickupSvc({ ...staffInput(parcelId), branchId: 'foreign' }),
    ).rejects.toThrow();
    await expect(
      returnHomeDeliveryToPickupSvc({ ...staffInput(parcelId), companyId: 'foreign' }),
    ).rejects.toThrow();
    await expect(
      returnHomeDeliveryToPickupSvc({ ...staffInput(parcelId), actorUserId: fixture.oldPicker }),
    ).rejects.toThrow('Only active branch staff');
    await expect(
      returnHomeDeliveryToPickupSvc({
        ...staffInput(parcelId),
        permissions: [PermissionKeys.CanDispatchForDelivery],
      }),
    ).rejects.toThrow('Missing permission');
    expect((await getParcelRepo(parcelId))?.status).toBe(
      ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
    );
    await doorToDoorFinalizeAtOfficeSvc({
      parcelId,
      companyId: fixture.companyId,
      branchId: fixture.branchId,
      cashierUserId: fixture.actor,
      method: PaymentMethod.CASH,
      deliveryFeeAmountCedis: '25.00',
    });
    await expect(returnHomeDeliveryToPickupSvc(staffInput(parcelId))).rejects.toThrow(
      'not eligible',
    );
    expect((await getParcelRepo(parcelId))?.status).toBe(ParcelStatus.DELIVERED_AT_HOME);
  });

  test('concurrent return and cashier finalization produce one consistent result', async () => {
    const parcelId = await fixture.parcel(0);
    await doorToDoorRiderGivenToCustomerSvc({
      parcelId,
      riderUserId: fixture.oldPicker,
      signatureImage: 'data:image/png;base64,test',
    });
    const results = await Promise.allSettled([
      returnHomeDeliveryToPickupSvc(staffInput(parcelId)),
      doorToDoorFinalizeAtOfficeSvc({
        parcelId,
        companyId: fixture.companyId,
        branchId: fixture.branchId,
        cashierUserId: fixture.actor,
        method: PaymentMethod.CASH,
      }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const parcel = await getParcelRepo(parcelId);
    const delivery = await getDeliveryByParcelRepo(parcelId);
    if (parcel?.status === ParcelStatus.AWAITING_PICKUP) {
      expect(delivery).toMatchObject({
        status: 'RETURNED_TO_OFFICE',
        confirmedAt: null,
        deliveredAt: null,
      });
    } else {
      expect(parcel?.status).toBe(ParcelStatus.DELIVERED_AT_HOME);
      expect(delivery?.status).toBe('DELIVERED_AT_HOME');
    }
  });
});
