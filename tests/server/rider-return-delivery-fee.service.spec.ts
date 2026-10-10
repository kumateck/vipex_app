import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DeliveryMode, ParcelStatus, PaymentComponent, PaymentMethod } from '@/db/schemas/enums';
import {
  doorToDoorAddressCollectedSvc,
  doorToDoorDispatchBulkSvc,
  doorToDoorFinalizeAtOfficeSvc,
  doorToDoorReturnToOfficeSvc,
  listDoorstepByRiderSvc,
} from '@/server/features/deliveries/service';
import { getDeliveryByParcelRepo } from '@/server/features/deliveries/repository';
import { doorToDoorRiderGivenToCustomerSvc } from '@/server/features/deliveries/rider-handover.service';
import {
  redispatchRiderReturnSvc,
  redispatchRiderReturnsBulkSvc,
  reprocessRiderReturnForPickupSvc,
} from '@/server/features/deliveries/rider-return-processing.service';
import { getParcelDetailsCtrl } from '@/server/features/shipments/parcels.controller';
import { getParcelRepo } from '@/server/features/shipments/parcels.repository';
import { getParcelPaymentSettlement } from '@/server/features/shipments/parcel-payment-settlement';
import { listPaymentsForParcelRepo } from '@/server/features/payments/repository';
import { createRiderReturnFeeFixture } from '../utils/rider-return-fee-fixture';

describe('delivery fees across rider returns', () => {
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
  });
  const returnParcel = (parcelId: string) =>
    doorToDoorReturnToOfficeSvc({
      parcelId,
      riderUserId: fixture.oldPicker,
    });

  test('preserves the configured fee through return, reassignment, handover and cashier collection', async () => {
    const parcelId = await fixture.parcel();
    await returnParcel(parcelId);
    expect(await getDeliveryByParcelRepo(parcelId)).toMatchObject({
      status: 'RETURNED_TO_OFFICE',
      chargePsw: 2500,
      dropoffAddress: 'Customer home',
    });
    expect((await getDeliveryByParcelRepo(parcelId))?.returnedAt).toBeInstanceOf(Date);
    await redispatchRiderReturnSvc({ ...staffInput(parcelId), riderUserId: fixture.newPicker });
    const riderList = await listDoorstepByRiderSvc({ riderUserId: fixture.newPicker });
    expect(riderList.rows.find((row) => row.parcelId === parcelId)).toMatchObject({
      deliveryFeePsw: 2500,
      outstandingDeliveryFeePsw: 2500,
    });
    await doorToDoorRiderGivenToCustomerSvc({
      parcelId,
      riderUserId: fixture.newPicker,
      signatureImage: 'data:image/png;base64,test',
      deliveryFeeAmountCedis: '25.00',
    });
    const details = await getParcelDetailsCtrl(parcelId);
    expect(details.delivery).toMatchObject({ mode: DeliveryMode.DOORSTEP, chargePsw: 2500 });
    expect((await getParcelPaymentSettlement(parcelId)).requiredDeliveryFeePsw).toBe(2500);
    await doorToDoorFinalizeAtOfficeSvc({
      parcelId,
      companyId: fixture.companyId,
      branchId: fixture.branchId,
      cashierUserId: fixture.actor,
      method: PaymentMethod.CASH,
      deliveryFeeAmountCedis: '25.00',
    });
    expect(await getParcelRepo(parcelId)).toMatchObject({ status: ParcelStatus.DELIVERED_AT_HOME });
    expect(await listPaymentsForParcelRepo(parcelId)).toEqual([
      expect.objectContaining({ component: PaymentComponent.DELIVERY_FEE, grossAmountPsw: 2500 }),
    ]);
    expect((await getParcelPaymentSettlement(parcelId)).outstandingPsw).toBe(0);
  });

  test('bulk return redispatch retains the fee and only the unpaid balance is collectable', async () => {
    const parcelId = await fixture.parcel(2500, 1000);
    await returnParcel(parcelId);
    expect(
      await redispatchRiderReturnsBulkSvc({
        ...staffInput(parcelId),
        parcelIds: [parcelId],
        riderUserId: fixture.newPicker,
      }),
    ).toEqual({ succeeded: [parcelId], failed: [] });
    const riderList = await listDoorstepByRiderSvc({ riderUserId: fixture.newPicker });
    expect(riderList.rows.find((row) => row.parcelId === parcelId)).toMatchObject({
      deliveryFeePsw: 2500,
      outstandingDeliveryFeePsw: 1500,
    });
    await expect(
      doorToDoorRiderGivenToCustomerSvc({
        parcelId,
        riderUserId: fixture.newPicker,
        signatureImage: 'signature',
        deliveryFeeAmountCedis: '25.00',
      }),
    ).rejects.toThrow('outstanding delivery fee of 15.00');
    await doorToDoorRiderGivenToCustomerSvc({
      parcelId,
      riderUserId: fixture.newPicker,
      signatureImage: 'signature',
      deliveryFeeAmountCedis: '15.00',
    });
    await doorToDoorFinalizeAtOfficeSvc({
      parcelId,
      companyId: fixture.companyId,
      branchId: fixture.branchId,
      cashierUserId: fixture.actor,
      method: PaymentMethod.CASH,
      deliveryFeeAmountCedis: '15.00',
    });
    expect((await getParcelPaymentSettlement(parcelId)).outstandingPsw).toBe(0);
  });

  test('dispatch reassignment keeps the fee across repeated returns', async () => {
    const parcelId = await fixture.parcel();
    await returnParcel(parcelId);
    await doorToDoorDispatchBulkSvc({
      parcelIds: [parcelId],
      riderUserId: fixture.newPicker,
      userId: fixture.actor,
    });
    await doorToDoorReturnToOfficeSvc({ parcelId, riderUserId: fixture.newPicker });
    expect((await getDeliveryByParcelRepo(parcelId))?.chargePsw).toBe(2500);
  });

  test('an already-paid fee remains visible without charging it again', async () => {
    const parcelId = await fixture.parcel(2500, 2500);
    await returnParcel(parcelId);
    await redispatchRiderReturnSvc({ ...staffInput(parcelId), riderUserId: fixture.newPicker });
    const riderList = await listDoorstepByRiderSvc({ riderUserId: fixture.newPicker });
    expect(riderList.rows.find((row) => row.parcelId === parcelId)).toMatchObject({
      deliveryFeePsw: 2500,
      outstandingDeliveryFeePsw: 0,
    });
    expect((await getParcelPaymentSettlement(parcelId)).outstandingPsw).toBe(0);
    expect(await listPaymentsForParcelRepo(parcelId)).toHaveLength(1);
  });

  test('moving to office pickup retains fee history but does not require a doorstep fee', async () => {
    const parcelId = await fixture.parcel();
    await returnParcel(parcelId);
    await reprocessRiderReturnForPickupSvc(staffInput(parcelId));
    expect((await getDeliveryByParcelRepo(parcelId))?.chargePsw).toBe(2500);
    expect((await getParcelPaymentSettlement(parcelId)).requiredDeliveryFeePsw).toBe(0);
  });

  test('explicit fee changes still apply and zero-fee deliveries stay zero', async () => {
    const parcelId = await fixture.parcel();
    await returnParcel(parcelId);
    await doorToDoorAddressCollectedSvc({
      parcelId,
      userId: fixture.actor,
      dropoffAddress: 'New address',
      deliveryFeeCedis: '30.00',
    });
    await doorToDoorDispatchBulkSvc({
      parcelIds: [parcelId],
      riderUserId: fixture.oldPicker,
      userId: fixture.actor,
    });
    await returnParcel(parcelId);
    expect((await getDeliveryByParcelRepo(parcelId))?.chargePsw).toBe(3000);
    const freeParcelId = await fixture.parcel(0);
    await returnParcel(freeParcelId);
    await redispatchRiderReturnSvc({ ...staffInput(freeParcelId), riderUserId: fixture.newPicker });
    expect((await getDeliveryByParcelRepo(freeParcelId))?.chargePsw).toBe(0);
  });

  test('wrong rider and repeated return requests cannot change the fee', async () => {
    const parcelId = await fixture.parcel();
    await expect(
      doorToDoorReturnToOfficeSvc({ parcelId, riderUserId: fixture.newPicker }),
    ).rejects.toThrow('not assigned to this rider');
    expect((await getDeliveryByParcelRepo(parcelId))?.chargePsw).toBe(2500);
    await returnParcel(parcelId);
    await expect(returnParcel(parcelId)).rejects.toThrow('Only dispatched parcels');
    expect((await getDeliveryByParcelRepo(parcelId))?.chargePsw).toBe(2500);
  });
});
