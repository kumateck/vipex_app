import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../src/db/config';
import { branches, companies, companyModules, moduleCatalog, roles, users } from '@/db/schemas';
import { BranchType, UserStatus, UserType } from '@/db/schemas/enums';
import { DEFAULT_MODULE_CATALOG } from '@/shared/company-modules/catalog';
import { hashPassword } from '../src/server/utils/password';

const COMPANY_NAME = 'Vipex Co. LTD';
const COMPANY_CODE = 'VIPEX';
const COMPANY_TYPE = 'COURIER';
const COMPANY_TIN = 'GHA-VX-001234';

const HEAD_OFFICE_BRANCH_NAME = 'Head Office';
const BRANCH_SEEDS = [
  { name: 'Head Office', type: BranchType.HEADOFFICE },
  { name: 'Kumasi', type: BranchType.AGENCY },
  { name: 'Accra', type: BranchType.AGENCY },
  { name: 'Sunyani', type: BranchType.AGENCY },
  { name: 'Tamale', type: BranchType.AGENCY },
] as const;

const ROLE_NAME = 'System Admin';

const SYS_FULLNAME = 'System User';
const SYS_EMAIL = 'sys@vipexparcel.com';
const SYS_TELEPHONE = '+233200000000';
const SYS_PASSWORD = 'ChangeMe123!';

async function ensureBranches(companyId: string, createdBy: string) {
  let headOfficeBranchId: string | null = null;
  for (const branchSeed of BRANCH_SEEDS) {
    const [existingBranch] = await db
      .select({ id: branches.id })
      .from(branches)
      .where(
        and(
          eq(branches.companyId, companyId),
          sql`lower(${branches.name}) = lower(${branchSeed.name})`,
        ),
      )
      .limit(1);

    if (existingBranch) {
      if (branchSeed.name === HEAD_OFFICE_BRANCH_NAME) headOfficeBranchId = existingBranch.id;
      continue;
    }

    const newBranchId = createId();
    await db.insert(branches).values({
      id: newBranchId,
      name: branchSeed.name,
      type: branchSeed.type,
      companyId,
      telephone: '+233302000000',
      address: '1 Vipex Ave, Accra, Ghana',
      email: branchSeed.name === HEAD_OFFICE_BRANCH_NAME ? 'headoffice@vipex.local' : null,
      isDeleted: false,
      createdBy,
    });

    if (branchSeed.name === HEAD_OFFICE_BRANCH_NAME) headOfficeBranchId = newBranchId;
  }

  if (!headOfficeBranchId) {
    throw new Error(`Required branch '${HEAD_OFFICE_BRANCH_NAME}' not found after branch seeding.`);
  }
  return { headOfficeBranchId };
}

async function main() {
  const [existingUser] = await db.select({ id: users.id }).from(users).limit(1);

  if (existingUser) {
    throw new Error(
      "seed:bootstrap is only for an empty database. Existing users were found, so use 'bun run seed:init' instead.",
    );
  }

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
  }

  const { headOfficeBranchId: branchId } = await ensureBranches(companyId, bootstrapActorId);

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
  }

  let sysUserId: string;
  const [existingSysUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.companyId, companyId), sql`lower(${users.email}) = lower(${SYS_EMAIL})`))
    .limit(1);

  if (existingSysUser) {
    sysUserId = existingSysUser.id;
  } else {
    sysUserId = bootstrapActorId;
    const hashedPassword = await hashPassword(SYS_PASSWORD);
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
  }

  for (const moduleDefinition of DEFAULT_MODULE_CATALOG) {
    const { code, name, isCore: isCoreEnabled, description } = moduleDefinition;
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
        description,
        isCore: isCoreEnabled,
        isActive: true,
      });
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
        configuredBy: sysUserId,
      });
    }
  }

  console.log('\nBootstrap seed complete.');
  console.log({
    companyId,
    branchId,
    roleId,
    userId: sysUserId,
    sysEmail: SYS_EMAIL,
    sysPassword: SYS_PASSWORD,
  });
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
