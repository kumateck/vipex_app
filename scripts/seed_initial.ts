import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../src/db/config';
import {
  branches,
  companies,
  companyModules,
  moduleCatalog,
  parcelContentCatalog,
  parcelDetailCatalog,
  roles,
  users,
} from '@/db/schemas';
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

const DEFAULT_PARCEL_PACKAGING = ['Box', 'Envelope', 'Sack', 'Crate'] as const;
const DEFAULT_PARCEL_CONTENTS = [
  { name: 'General Goods', basePricePsw: 3000, taxInclusive: true, sortOrder: 10 },
  { name: 'Documents', basePricePsw: 2000, taxInclusive: true, sortOrder: 20 },
  { name: 'Spare Parts', basePricePsw: 50000, taxInclusive: true, sortOrder: 30 },
] as const;

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
      if (branchSeed.name === HEAD_OFFICE_BRANCH_NAME) {
        headOfficeBranchId = existingBranch.id;
      }
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
    console.log(`Created branch: ${branchSeed.name} (${newBranchId})`);
    if (branchSeed.name === HEAD_OFFICE_BRANCH_NAME) {
      headOfficeBranchId = newBranchId;
    }
  }

  if (!headOfficeBranchId) {
    const [headOffice] = await db
      .select({ id: branches.id })
      .from(branches)
      .where(
        and(
          eq(branches.companyId, companyId),
          sql`lower(${branches.name}) = lower(${HEAD_OFFICE_BRANCH_NAME})`,
        ),
      )
      .limit(1);
    headOfficeBranchId = headOffice?.id ?? null;
  }

  if (!headOfficeBranchId) {
    throw new Error(`Required branch '${HEAD_OFFICE_BRANCH_NAME}' not found after branch seeding.`);
  }

  return { headOfficeBranchId };
}

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

  for (const style of DEFAULT_PARCEL_PACKAGING) {
    const [existing] = await db
      .select({ id: parcelDetailCatalog.id })
      .from(parcelDetailCatalog)
      .where(
        and(
          eq(parcelDetailCatalog.companyId, companyId),
          sql`lower(${parcelDetailCatalog.name}) = lower(${style})`,
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(parcelDetailCatalog).values({
        id: createId(),
        companyId,
        name: style,
        active: true,
        sortOrder: DEFAULT_PARCEL_PACKAGING.indexOf(style) + 1,
        createdBy: creatorId,
      });
      console.log(`Created parcel packaging style: ${style}`);
    }
  }

  for (const content of DEFAULT_PARCEL_CONTENTS) {
    const [existing] = await db
      .select({ id: parcelContentCatalog.id })
      .from(parcelContentCatalog)
      .where(
        and(
          eq(parcelContentCatalog.companyId, companyId),
          sql`lower(${parcelContentCatalog.name}) = lower(${content.name})`,
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(parcelContentCatalog).values({
        id: createId(),
        companyId,
        name: content.name,
        basePricePsw: content.basePricePsw,
        taxInclusive: content.taxInclusive,
        active: true,
        sortOrder: content.sortOrder,
        createdBy: creatorId,
      });
      console.log(`Created parcel content: ${content.name}`);
    }
  }

  const { headOfficeBranchId: branchId } = await ensureBranches(companyId, creatorId);
  console.log(`Head Office branch ready: ${branchId}`);

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
