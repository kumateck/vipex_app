import { and, eq, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, customers } from '@/db/schemas';
import type { AuthUser } from '@/server/plugins/auth';
import { Conflict, Forbidden } from '@/server/utils/http-error';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { normalizeDraftContact } from './draft-customer.rules';

type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function resolveDraftContact(
  tx: Executor,
  companyId: string,
  actor: AuthUser,
  input: ReturnType<typeof normalizeDraftContact>,
  previous: { fullname: string; phone: string; phone2: string | null; customerId: string | null },
) {
  if (
    input.fullname === previous.fullname &&
    input.phone === previous.phone &&
    input.phone2 === previous.phone2
  )
    return previous.customerId;
  const matches = await tx
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.companyId, companyId),
        eq(customers.isDeleted, false),
        or(
          eq(customers.telephone, input.phone),
          eq(customers.telephone2, input.phone),
          ...(input.phone2
            ? [eq(customers.telephone, input.phone2), eq(customers.telephone2, input.phone2)]
            : []),
        ),
      ),
    )
    .for('update');
  if (matches.length > 1)
    throw Conflict(
      'More than one customer matches this number; resolve the customer records first',
    );
  const customer = matches.find(
    (match) => match.telephone === input.phone || match.telephone2 === input.phone,
  );
  if (!customer && matches.length)
    throw Conflict(
      'Backup number belongs to a saved customer; select that customer or correct the number',
    );
  if (!customer) return null;
  if (
    customer.fullname === input.fullname &&
    customer.telephone === input.phone &&
    customer.telephone2 === input.phone2
  )
    return customer.id;
  if (!actor.permissions?.includes(PermissionKeys.CanUpdateCustomers))
    throw Forbidden('Customer update permission is required to change a saved customer');
  await tx
    .update(customers)
    .set({
      fullname: input.fullname,
      telephone: input.phone,
      telephone2: input.phone2,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customer.id));
  await tx.insert(auditLogs).values({
    companyId,
    actorUserId: actor.sub,
    entityType: 'customer',
    entityId: customer.id,
    action: 'CUSTOMER_UPDATED',
    message: 'Customer contact corrected from self-service booking',
    metadata: {
      previous: {
        fullname: customer.fullname,
        telephone: customer.telephone,
        telephone2: customer.telephone2,
      },
      patch: { fullname: input.fullname, telephone: input.phone, telephone2: input.phone2 },
    },
  });
  return customer.id;
}
