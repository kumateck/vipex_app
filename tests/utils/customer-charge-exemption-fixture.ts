import { db, sql } from '@/db/config';
import { branches, users, customers, employees } from '@/db/schemas';
import { createIsolatedSchemaFixture } from './isolated-schema-fixture';

export async function createChargeExemptionFixture() {
  await createIsolatedSchemaFixture('vipex_charge_exemption_test');
  await sql.begin(async (tx) => {
    await tx.unsafe(await Bun.file('drizzle/0092_customer_charge_exemptions.sql').text());
  });
  await db.insert(branches).values([
    { id: 'source', companyId: 'company', name: 'Accra', createdBy: 'officer' },
    { id: 'destination', companyId: 'company', name: 'Kumasi', createdBy: 'officer' },
  ]);
  await db.insert(users).values({
    id: 'officer',
    companyId: 'company',
    branchId: 'source',
    fullname: 'Booking officer',
    telephone: '0240000000',
    email: 'officer@test.local',
    roleId: 'role',
    createdBy: 'officer',
  });
  await db.insert(customers).values([
    ...[0, 1, 2, 3, 4, 5].map((customerType) => ({
      id: `customer-${customerType}`,
      companyId: 'company',
      fullname: `Customer ${customerType}`,
      telephone: `024000000${customerType}`,
      customerType,
      createdBy: 'officer',
    })),
    {
      id: 'other-company',
      companyId: 'other',
      fullname: 'Other',
      customerType: 2,
      createdBy: 'officer',
    },
  ]);
  await db.insert(employees).values(
    [
      { id: 'ama', companyId: 'company', branchId: 'destination', employmentStatus: 0 },
      { id: 'inactive', companyId: 'company', branchId: 'destination', employmentStatus: 5 },
      { id: 'wrong-branch', companyId: 'company', branchId: 'source', employmentStatus: 0 },
      { id: 'wrong-company', companyId: 'other', branchId: 'destination', employmentStatus: 0 },
    ].map((row) => ({
      ...row,
      employeeNumber: row.id,
      firstName: 'Ama',
      lastName: 'Mensah',
      displayName: row.id === 'ama' ? 'Ama Mensah' : row.id,
      telephone: '0240000009',
      hireDate: new Date('2020-01-01'),
    })),
  );
  return {
    cleanup: async () => {
      await sql.unsafe('DROP SCHEMA public CASCADE');
      await sql.unsafe('CREATE SCHEMA public');
    },
  };
}
