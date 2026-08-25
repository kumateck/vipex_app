import { and, asc, eq, ne, notInArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, roles, users } from '@/db/schemas';
import { UserStatus } from '@/db/schemas/enums';

export async function listUserPasswordTargetsRepo(input: {
  companyId: string;
  actorUserId: string;
}) {
  return db
    .select({
      id: users.id,
      fullname: users.fullname,
      email: users.email,
      roleName: roles.name,
      branchName: branches.name,
    })
    .from(users)
    .leftJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(branches, eq(branches.id, users.branchId))
    .where(
      and(
        eq(users.companyId, input.companyId),
        ne(users.id, input.actorUserId),
        notInArray(users.status, [UserStatus.INVITED, UserStatus.REMOVED]),
      ),
    )
    .orderBy(asc(users.fullname), asc(users.id));
}
