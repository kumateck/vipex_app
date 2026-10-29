import { db } from '@/db/config';
import {
  branches,
  companies,
  companyModules,
  customers,
  parcels,
  payments,
  rolePermissions,
  users,
} from '@/db/schemas';
import { PaymentComponent, Payer } from '@/db/schemas/enums';
import { createIsolatedSchemaFixture } from './isolated-schema-fixture';
export const TAX_DATE = '2026-10-22';
export async function createParcelTaxDataFixture() {
  const schema = await createIsolatedSchemaFixture('vipex_tax_data_test');
  await db.insert(companies).values(
    ['company', 'foreign-company'].map((id) => ({
      id,
      name: id,
      code: id,
      type: 'courier',
      useAccounting: true,
      createdBy: 'test',
    })),
  );
  await db.insert(companyModules).values(
    ['company', 'foreign-company'].map((companyId) => ({
      companyId,
      moduleCode: 'accounting',
      isEnabled: true,
    })),
  );
  await db.insert(branches).values([
    { id: 'accra', companyId: 'company', name: 'Accra', createdBy: 'test' },
    { id: 'kumasi', companyId: 'company', name: 'Kumasi', createdBy: 'test' },
    { id: 'tema', companyId: 'company', name: 'Tema', createdBy: 'test' },
    { id: 'head', companyId: 'company', name: 'Head Office', type: 0, createdBy: 'test' },
    { id: 'foreign', companyId: 'foreign-company', name: 'Foreign', createdBy: 'test' },
  ]);
  await db.insert(users).values(
    ['reader', 'confirmer', 'denied', 'head'].map((id) => ({
      id,
      fullname: id,
      email: `${id}@example.test`,
      telephone: '0240000000',
      companyId: 'company',
      branchId: id === 'head' ? 'head' : 'accra',
      roleId: id,
      createdBy: 'test',
    })),
  );
  await db.insert(rolePermissions).values([
    ...['reader', 'confirmer', 'head'].map((roleId) => ({
      roleId,
      companyId: 'company',
      permission: 'CanReadAccounting',
    })),
    { roleId: 'confirmer', companyId: 'company', permission: 'CanConfirmParcelTaxData' },
    { roleId: 'head', companyId: 'company', permission: 'CanConfirmParcelTaxData' },
  ]);
  await db.insert(customers).values(
    ['sender', 'receiver'].map((id) => ({
      id,
      companyId: 'company',
      fullname: id,
      telephone: '0240000001',
      createdBy: 'test',
    })),
  );
  const base = {
    companyId: 'company',
    sourceId: 'accra',
    destinationId: 'kumasi',
    bookingId: 'shared-booking',
    bookingCode: 'SHARED-INVOICE',
    senderId: 'sender',
    receiverId: 'receiver',
    parcelDetails: 'Box',
    parcelContent: 'Books',
    chargePsw: 20000,
    createdAt: new Date(`${TAX_DATE}T00:00:00Z`),
  };
  await db.insert(parcels).values([
    { ...base, id: 'one', trackingCode: 'TRACK-ONE' },
    { ...base, id: 'two', trackingCode: 'TRACK-TWO', destinationId: 'tema' },
    { ...base, id: 'confirmed', trackingCode: 'CONFIRMED', taxReportConfirmation: true },
    { ...base, id: 'unpaid', trackingCode: 'UNPAID' },
    { ...base, id: 'deleted', trackingCode: 'DELETED', isDeleted: true },
    {
      ...base,
      id: 'foreign',
      trackingCode: 'FOREIGN',
      sourceId: 'foreign',
      companyId: 'foreign-company',
    },
    { ...base, id: 'void-only', trackingCode: 'VOID' },
    { ...base, id: 'fee-only', trackingCode: 'FEE' },
    { ...base, id: 'next-day', trackingCode: 'NEXT', createdAt: new Date('2026-10-23T00:00:00Z') },
    {
      ...base,
      id: 'other-branch',
      trackingCode: 'OTHER',
      sourceId: 'kumasi',
      destinationId: 'accra',
    },
  ]);
  const payment = {
    companyId: 'company',
    branchId: 'accra',
    component: PaymentComponent.PRINCIPAL,
    cashierUserId: 'reader',
    grossAmountPsw: 10000,
    netAmountPsw: 8100,
    vatPsw: 1300,
    getfundPsw: 200,
    nhilPsw: 200,
    covidPsw: 0,
    taxTotalPsw: 1900,
  };
  await db.insert(payments).values([
    { ...payment, id: 'pay-one-a', parcelId: 'one' },
    {
      ...payment,
      id: 'pay-one-b',
      parcelId: 'one',
      payer: Payer.RECIPIENT,
      grossAmountPsw: 5000,
      netAmountPsw: 4100,
      vatPsw: 700,
      getfundPsw: 100,
      nhilPsw: 100,
      taxTotalPsw: 900,
    },
    { ...payment, id: 'pay-one-void', parcelId: 'one', voidedAt: new Date() },
    { ...payment, id: 'pay-one-fee', parcelId: 'one', component: PaymentComponent.DELIVERY_FEE },
    ...['two', 'confirmed', 'deleted', 'void-only', 'fee-only', 'next-day', 'other-branch'].map(
      (id) => ({
        ...payment,
        id: `pay-${id}`,
        parcelId: id,
        branchId: id === 'other-branch' ? 'kumasi' : 'accra',
        component: id === 'fee-only' ? PaymentComponent.DELIVERY_FEE : PaymentComponent.PRINCIPAL,
        voidedAt: id === 'void-only' ? new Date() : null,
      }),
    ),
    {
      ...payment,
      id: 'pay-foreign',
      parcelId: 'foreign',
      companyId: 'foreign-company',
      branchId: 'foreign',
    },
  ]);
  return schema;
}
