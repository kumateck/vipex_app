import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { whatsappBillingRates } from '@/db/schemas';

/** The company's client price history, oldest start date first. */
export async function listWhatsAppBillingRatesRepo(companyId: string) {
  return db
    .select()
    .from(whatsappBillingRates)
    .where(eq(whatsappBillingRates.companyId, companyId))
    .orderBy(asc(whatsappBillingRates.effectiveFrom));
}

/** Creates the price period starting on `effectiveFrom`, or replaces it if it exists. */
export async function upsertWhatsAppBillingRateRepo(input: {
  companyId: string;
  actorUserId: string;
  effectiveFrom: string;
  currency: string;
  authenticationRateMicros: number;
  utilityRateMicros: number;
  marketingRateMicros: number;
}) {
  const values = {
    currency: input.currency,
    authenticationRateMicros: input.authenticationRateMicros,
    utilityRateMicros: input.utilityRateMicros,
    marketingRateMicros: input.marketingRateMicros,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(whatsappBillingRates)
    .values({
      ...values,
      companyId: input.companyId,
      effectiveFrom: input.effectiveFrom,
      createdBy: input.actorUserId,
    })
    .onConflictDoUpdate({
      target: [whatsappBillingRates.companyId, whatsappBillingRates.effectiveFrom],
      set: values,
    })
    .returning();
  return row ?? null;
}

export async function deleteWhatsAppBillingRateRepo(id: string, companyId: string) {
  const [row] = await db
    .delete(whatsappBillingRates)
    .where(and(eq(whatsappBillingRates.id, id), eq(whatsappBillingRates.companyId, companyId)))
    .returning();
  return row ?? null;
}
