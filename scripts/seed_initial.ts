import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/config';
import { companies, branches, roles, users } from '@/db/schemas';
import { BranchType, UserStatus, UserType } from '@/db/schemas/enums';
// import { companies, branches, roles, users } from '../src/db/schema';

async function main() {
  // Deterministic "sys" user id for cross-referencing created_by, even before user insert.
  const sysUserId = createId();

  const COMPANY_NAME = 'Vipex Co. LTD';
  const COMPANY_CODE = 'VIPEX';
  const COMPANY_TYPE = 'COURIER';
  const COMPANY_TIN = 'GHA-VX-001234'; // generated

  const BRANCH_NAME = 'Head Office';
  const BRANCH_TYPE = BranchType.HEADOFFICE;

  const ROLE_NAME = 'System Admin';

  const SYS_FULLNAME = 'System User';

  const SYS_EMAIL = 'sys@vipexparcel.com';
  const SYS_TELEPHONE = '+233200000000';
  const SYS_PASSWORD = 'ChangeMe123!'; // NOTE: plaintext for seeding; replace with your hash if auth requires


  

  // 1) Company (by code)
  let companyId: string;
  {
    const existing = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.code, COMPANY_CODE))
      .limit(1);

    if (existing.length) {
      companyId = existing[0]?.id ?? createId();
    } else {
      companyId = createId();
      await db.insert(companies).values({
        id: companyId,
        name: COMPANY_NAME,
        type: COMPANY_TYPE,
        code: COMPANY_CODE,
        tin: COMPANY_TIN,
        isDeleted: false,
        createdBy: sysUserId,
      });
      console.log(`Created company: ${COMPANY_NAME} (${companyId})`);
    }
  }

  // 2) Branch (by company + name)
  let branchId: string;
  {
    const existing = await db
      .select({ id: branches.id })
      .from(branches)
      .where(and(eq(branches.companyId, companyId), eq(branches.name, BRANCH_NAME)))
      .limit(1);

    if (existing.length) {
      branchId = existing[0]?.id ?? createId();
    } else {
      branchId = createId();
      await db.insert(branches).values({
        id: branchId,
        name: BRANCH_NAME,
        type: BRANCH_TYPE,
        companyId,
        telephone: '+233302000000',
        address: '1 Vipex Ave, Accra, Ghana',
        email: 'headoffice@vipex.local',
        isDeleted: false,
        createdBy: sysUserId,
      });
      console.log(`Created branch: ${BRANCH_NAME} (${branchId})`);
    }
  }

  // 3) Role (by company + name)
  let roleId: string;
  {
    const existing = await db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.companyId, companyId), eq(roles.name, ROLE_NAME)))
      .limit(1);

    if (existing.length) {
      roleId = existing[0]?.id ?? createId();
    } else {
      roleId = createId();
      await db.insert(roles).values({
        id: roleId,
        companyId,
        name: ROLE_NAME,
        createdBy: sysUserId,
        isDeleted: false,
      });
      console.log(`Created role: ${ROLE_NAME} (${roleId})`);
    }
  }

  // 4) User (by email)
  let userId: string;
  {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, SYS_EMAIL))
      .limit(1);

    if (existing.length) {
      userId = existing[0]?.id ?? createId();
      console.log(`User already exists: ${SYS_EMAIL} (${userId})`);
    } else {
      userId = sysUserId; // keep consistent with created_by references above
      await db.insert(users).values({
        id: userId,
        fullname: SYS_FULLNAME,
        telephone: SYS_TELEPHONE,
        email: SYS_EMAIL,
        password: SYS_PASSWORD, // replace with hash as needed
        status: UserStatus.ACTIVE,
        roleId,
        companyId,
        branchId,
        locationId: null,
        userType: UserType.STAFF,
        createdBy: userId, // self-created
        taxReportConfirmation: false,
      });
      console.log(`Created user: ${SYS_EMAIL} (${userId})`);
    }
  }

  console.log('\nSeed complete.');
  console.log({
    companyId,
    branchId,
    roleId,
    userId,
    sysEmail: SYS_EMAIL,
    sysPassword: SYS_PASSWORD,
  });
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
