import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { users, UserStatus } from '@/db/schemas';
import { assertParcelChargeAgentSelections } from './parcel-charge-agents.rules';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type AgentScope = { companyId: string; sourceId: string };

const eligibleScope = (scope: AgentScope) =>
  and(
    eq(users.companyId, scope.companyId),
    eq(users.branchId, scope.sourceId),
    eq(users.status, UserStatus.ACTIVE),
  );

export function listParcelChargeAgentOptionsRepo(scope: AgentScope) {
  return db
    .select({ id: users.id, fullname: users.fullname })
    .from(users)
    .where(eligibleScope(scope))
    .orderBy(asc(users.fullname), asc(users.id));
}

export async function assertParcelChargeAgentsRepo(
  input: AgentScope & { parcels: ReadonlyArray<{ chargeAgentUserId?: string | null }> },
  tx: Transaction,
) {
  const ids = [
    ...new Set(
      input.parcels.flatMap((p) => (p.chargeAgentUserId == null ? [] : [p.chargeAgentUserId])),
    ),
  ];
  if (!ids.length) return;
  // Hold staff scope/status stable until the booking transaction commits.
  const eligible = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eligibleScope(input), inArray(users.id, ids)))
    .orderBy(asc(users.id))
    .for('share');
  assertParcelChargeAgentSelections(input.parcels, new Set(eligible.map((row) => row.id)));
}
