import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, roles, taxFilingAuditLogs, taxJournalItems } from '@/db/schemas';
import { settleReceiverPayments } from '@/server/features/payments/services/settle-receiver-payments';
import { createReceiverHandoverFixture } from './receiver-handover-fixture';

export async function createUnpaidReceiverHandoverFixture() {
  const fixture = await createReceiverHandoverFixture();
  await db.update(roles).set({ name: 'System Admin' }).where(eq(roles.id, fixture.roleId));
  const admin = {
    sub: fixture.actor,
    companyId: fixture.companyId,
    roleId: fixture.roleId,
    email: `${fixture.actor}@example.test`,
  };
  const prepare = async (options: Parameters<typeof fixture.prepare>[0] = {}) => {
    const prepared = await fixture.prepare(options);
    await fixture.sign(prepared.action);
    const [saved] = await db.select().from(parcels).where(eq(parcels.id, prepared.parcel.id));
    const pending = saved!.pendingReceiverHandover!;
    delete pending.paymentPlan;
    const posted = await db.transaction(async (tx) => {
      await tx
        .update(parcels)
        .set({ pendingReceiverHandover: null })
        .where(eq(parcels.id, prepared.parcel.id));
      const result = await settleReceiverPayments(prepared.input, tx);
      pending.snapshot.paymentIds = [result.payment?.id, result.storagePayment?.id].filter(
        (id): id is string => Boolean(id),
      );
      await tx
        .update(parcels)
        .set({ pendingReceiverHandover: pending })
        .where(eq(parcels.id, prepared.parcel.id));
      return result;
    });
    const [tax] = await db
      .insert(taxJournalItems)
      .values({
        companyId: fixture.companyId,
        branchId: fixture.branchId,
        sourceType: 7,
        sourceId: (posted.payment ?? posted.storagePayment)!.id,
        taxBasePsw: 1000,
        taxTotalPsw: 0,
        filingStatus: 0,
      })
      .returning();
    return { ...prepared, pending, posted, tax: tax! };
  };
  return {
    ...fixture,
    admin,
    prepare,
    cleanup: async () => {
      const taxes = await db
        .select()
        .from(taxJournalItems)
        .where(eq(taxJournalItems.companyId, fixture.companyId));
      for (const tax of taxes)
        await db.delete(taxFilingAuditLogs).where(eq(taxFilingAuditLogs.taxJournalItemId, tax.id));
      await db.delete(taxJournalItems).where(eq(taxJournalItems.companyId, fixture.companyId));
      await fixture.cleanup();
    },
  };
}
