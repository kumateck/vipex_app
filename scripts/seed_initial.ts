import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../src/db/config';
import { branches, companies, companyModules, moduleCatalog, roles, users } from '@/db/schemas';
import { BranchType, UserStatus, UserType } from '@/db/schemas/enums';
import { hashPassword } from '../src/server/utils/password';

const COMPANY_NAME = 'Vipex Co. LTD';
const COMPANY_CODE = 'VIPEX';
const COMPANY_TYPE = 'COURIER';
const COMPANY_TIN = 'GHA-VX-001234';

const BRANCH_NAME = 'Head Office';
const BRANCH_TYPE = BranchType.HEADOFFICE;

const ROLE_NAME = 'System Admin';
const SYS_FULLNAME = 'System User';
const SYS_EMAIL = 'sys@vipexparcel.com';
const SYS_TELEPHONE = '+233200000000';
const SYS_PASSWORD = 'ChangeMe123!';

const MODULES = [
  ['shipments', 'Shipments', true],
  ['customers', 'Customers', true],
  ['payments', 'Payments', true],
  ['accounting', 'Accounting', true],
  ['inventory', 'Inventory', true],
  ['shifts', 'Shifts', true],
  ['hr', 'HR', false],
  ['payroll', 'Payroll', false],
] as const;

async function main() {
  let [existingUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .orderBy(users.createdAt)
    .limit(1);

  if (!existingUser) {
    console.log('No users found. Bootstrapping system user...');
    const bootstrapActorId = createId();

    let companyId: string;
    const [existingCompany] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(sql`lower(${companies.code}) = lower(${COMPANY_CODE})`)
      .limit(1);

    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      companyId = createId();
      await db.insert(companies).values({
        id: companyId,
        name: COMPANY_NAME,
        type: COMPANY_TYPE,
        code: COMPANY_CODE,
        tin: COMPANY_TIN,
        isDeleted: false,
        createdBy: bootstrapActorId,
      });
      console.log(`Created company: ${COMPANY_NAME} (${companyId})`);
    }

    let branchId: string;
    const [existingBranch] = await db
      .select({ id: branches.id })
      .from(branches)
      .where(
        and(
          eq(branches.companyId, companyId),
          sql`lower(${branches.name}) = lower(${BRANCH_NAME})`,
        ),
      )
      .limit(1);

    if (existingBranch) {
      branchId = existingBranch.id;
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
        createdBy: bootstrapActorId,
      });
      console.log(`Created branch: ${BRANCH_NAME} (${branchId})`);
    }

    let roleId: string;
    const [existingRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.companyId, companyId), sql`lower(${roles.name}) = lower(${ROLE_NAME})`))
      .limit(1);

    if (existingRole) {
      roleId = existingRole.id;
    } else {
      roleId = createId();
      await db.insert(roles).values({
        id: roleId,
        companyId,
        name: ROLE_NAME,
        createdBy: bootstrapActorId,
        isDeleted: false,
      });
      console.log(`Created role: ${ROLE_NAME} (${roleId})`);
    }

    const hashedPassword = await hashPassword(SYS_PASSWORD);
    const sysUserId = bootstrapActorId;
    await db.insert(users).values({
      id: sysUserId,
      fullname: SYS_FULLNAME,
      telephone: SYS_TELEPHONE,
      email: SYS_EMAIL,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      roleId,
      companyId,
      branchId,
      locationId: null,
      userType: UserType.STAFF,
      createdBy: sysUserId,
      taxReportConfirmation: false,
    });

    existingUser = { id: sysUserId, email: SYS_EMAIL };
    console.log(`Created system user: ${SYS_EMAIL} (${sysUserId})`);
  }

  const creatorId = existingUser.id;
  console.log(`Using existing user as creator: ${existingUser.email ?? creatorId}`);

  let companyId: string;
  {
    const [existing] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(sql`lower(${companies.code}) = lower(${COMPANY_CODE})`)
      .limit(1);

    if (existing) {
      companyId = existing.id;
      console.log(`Company already exists: ${COMPANY_CODE} (${companyId})`);
    } else {
      companyId = createId();
      await db.insert(companies).values({
        id: companyId,
        name: COMPANY_NAME,
        type: COMPANY_TYPE,
        code: COMPANY_CODE,
        tin: COMPANY_TIN,
        isDeleted: false,
        createdBy: creatorId,
      });
      console.log(`Created company: ${COMPANY_NAME} (${companyId})`);
    }
  }

  for (const [code, name, isCoreEnabled] of MODULES) {
    const [existingModule] = await db
      .select({ id: moduleCatalog.id })
      .from(moduleCatalog)
      .where(sql`lower(${moduleCatalog.code}) = lower(${code})`)
      .limit(1);

    if (!existingModule) {
      await db.insert(moduleCatalog).values({
        id: createId(),
        code,
        name,
        description: `${name} module`,
        isCore: isCoreEnabled,
        isActive: true,
      });
      console.log(`Created module catalog entry: ${code}`);
    }

    const [existingCompanyModule] = await db
      .select({ id: companyModules.id })
      .from(companyModules)
      .where(
        and(
          eq(companyModules.companyId, companyId),
          sql`lower(${companyModules.moduleCode}) = lower(${code})`,
        ),
      )
      .limit(1);

    if (!existingCompanyModule) {
      await db.insert(companyModules).values({
        id: createId(),
        companyId,
        moduleCode: code,
        isEnabled: isCoreEnabled,
        enabledAt: isCoreEnabled ? new Date() : null,
        disabledAt: isCoreEnabled ? null : new Date(),
        configuredBy: creatorId,
      });
      console.log(`Created company module state: ${code}`);
    }
  }

  let branchId: string;
  {
    const [existing] = await db
      .select({ id: branches.id })
      .from(branches)
      .where(
        and(
          eq(branches.companyId, companyId),
          sql`lower(${branches.name}) = lower(${BRANCH_NAME})`,
        ),
      )
      .limit(1);

    if (existing) {
      branchId = existing.id;
      console.log(`Branch already exists: ${BRANCH_NAME} (${branchId})`);
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
        createdBy: creatorId,
      });
      console.log(`Created branch: ${BRANCH_NAME} (${branchId})`);
    }
  }

  let roleId: string;
  {
    const [existing] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.companyId, companyId), sql`lower(${roles.name}) = lower(${ROLE_NAME})`))
      .limit(1);

    if (existing) {
      roleId = existing.id;
      console.log(`Role already exists: ${ROLE_NAME} (${roleId})`);
    } else {
      roleId = createId();
      await db.insert(roles).values({
        id: roleId,
        companyId,
        name: ROLE_NAME,
        createdBy: creatorId,
        isDeleted: false,
      });
      console.log(`Created role: ${ROLE_NAME} (${roleId})`);
    }
  }

  console.log('\nBaseline seed complete.');
  console.log({
    companyId,
    branchId,
    roleId,
    creatorUserId: creatorId,
  });
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
