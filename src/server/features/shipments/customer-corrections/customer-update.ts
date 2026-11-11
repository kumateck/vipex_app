import { and, eq, ne, or } from 'drizzle-orm';
import { auditLogs, customers, customerCreditTransactions } from '@/db/schemas';
import { Conflict, NotFound } from '@/server/utils/http-error';
import type { CustomerCorrectionInput } from '@/shared/shipments/parcel-customer-correction';
import { customerColumns, type CorrectionTransaction } from './repository';
import { invalidateCustomerPickupCredentials } from './pickup-credentials';

export async function resolveCorrectionCustomer(
  tx: CorrectionTransaction,
  input: CustomerCorrectionInput & { companyId: string; actorUserId: string },
  currentId: string,
) {
  const [current] = await tx
    .select(customerColumns)
    .from(customers)
    .where(
      and(
        eq(customers.id, currentId),
        eq(customers.companyId, input.companyId),
        eq(customers.isDeleted, false),
      ),
    )
    .for('update');
  if (!current) throw NotFound('Linked customer is inactive or missing');
  if (current.version !== input.expectedCustomerVersion)
    throw Conflict('Customer details changed; find the parcel again');

  if (input.mode === 'relink') {
    const [replacement] = await tx
      .select(customerColumns)
      .from(customers)
      .where(
        and(
          eq(customers.id, input.customerId!),
          eq(customers.companyId, input.companyId),
          eq(customers.isDeleted, false),
        ),
      )
      .for('update');
    if (
      !replacement ||
      ![replacement.telephone, replacement.telephone2].includes(input.telephone)
    ) {
      throw Conflict('Selected customer no longer matches the telephone; look it up again');
    }
    if (replacement.version !== input.replacementVersion)
      throw Conflict('Selected customer changed; look it up again');
    if (replacement.id === currentId)
      throw Conflict('This customer is already linked; use Correct name and telephone');
    const [credit] = await tx
      .select({ id: customerCreditTransactions.id })
      .from(customerCreditTransactions)
      .where(
        and(
          eq(customerCreditTransactions.companyId, input.companyId),
          eq(customerCreditTransactions.customerId, currentId),
          eq(customerCreditTransactions.referenceId, input.parcelId),
        ),
      )
      .limit(1);
    if (credit)
      throw Conflict(
        'Accounts must reconcile this customer’s parcel credit history before relinking',
      );
    return { previous: current, customer: replacement, affectedParcels: 1 };
  }

  const phones = [input.telephone, input.telephone2].filter((phone): phone is string => !!phone);
  const [duplicate] = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.companyId, input.companyId),
        eq(customers.isDeleted, false),
        ne(customers.id, currentId),
        or(
          ...phones.map((phone) =>
            or(eq(customers.telephone, phone), eq(customers.telephone2, phone)),
          ),
        ),
      ),
    )
    .limit(1);
  if (duplicate)
    throw Conflict('This number belongs to another customer; use Link existing customer');
  const [updated] = await tx
    .update(customers)
    .set({
      fullname: input.updateName ? input.fullname : current.fullname,
      telephone: input.telephone,
      telephone2: input.telephone2,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, currentId))
    .returning(customerColumns);
  if (!updated) throw Conflict('Customer could not be updated');
  const affectedParcels = await invalidateCustomerPickupCredentials(tx, input.companyId, currentId);
  await tx.insert(auditLogs).values({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'customer',
    entityId: currentId,
    action: 'CUSTOMER_UPDATED',
    message: 'Customer corrected through parcel customer corrections',
    metadata: {
      parcelId: input.parcelId,
      reason: input.reason,
      previous: current,
      patch: updated,
      affectedParcels,
    },
  });
  return { previous: current, customer: updated, affectedParcels };
}
