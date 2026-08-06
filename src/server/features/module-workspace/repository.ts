import { and, count, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, customers, employees, parcels, payments } from '@/db/schemas';

export async function getModuleWorkspaceMetricsRepo(companyId: string) {
  const [branchRow, customerRow, employeeRow, parcelRow, paymentRow] = await Promise.all([
    db
      .select({ c: count() })
      .from(branches)
      .where(and(eq(branches.companyId, companyId), eq(branches.isDeleted, false)))
      .then((rows) => rows[0]),
    db
      .select({ c: count() })
      .from(customers)
      .where(eq(customers.companyId, companyId))
      .then((rows) => rows[0]),
    db
      .select({ c: count() })
      .from(employees)
      .where(and(eq(employees.companyId, companyId), eq(employees.isDeleted, false)))
      .then((rows) => rows[0]),
    db
      .select({ c: count() })
      .from(parcels)
      .where(and(eq(parcels.companyId, companyId), eq(parcels.isDeleted, false)))
      .then((rows) => rows[0]),
    db
      .select({ c: count() })
      .from(payments)
      .where(and(eq(payments.companyId, companyId), isNull(payments.voidedAt)))
      .then((rows) => rows[0]),
  ]);

  return {
    totalBranches: Number((branchRow?.c as unknown as bigint) ?? 0n),
    totalCustomers: Number((customerRow?.c as unknown as bigint) ?? 0n),
    totalEmployees: Number((employeeRow?.c as unknown as bigint) ?? 0n),
    totalParcels: Number((parcelRow?.c as unknown as bigint) ?? 0n),
    totalPayments: Number((paymentRow?.c as unknown as bigint) ?? 0n),
  };
}
