import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
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
  const [existingUser] = await db.select({ id: users.id }).from(users).limit(1);

  if (existingUser) {
    throw new Error(
      "seed:bootstrap is only for an empty database. Existing users were found, so use 'bun run seed:init' instead.",
    );
  }

  const sysUserId = createId();
  const hashedPassword = await hashPassword(SYS_PASSWORD);

  const companyId = createId();
  await db.insert(companies).values({
    id: companyId,
    name: COMPANY_NAME,
    type: COMPANY_TYPE,
    code: COMPANY_CODE,
    tin: COMPANY_TIN,
    isDeleted: false,
    createdBy: sysUserId,
  });

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
    }

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

  const branchId = createId();
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

  const roleId = createId();
  await db.insert(roles).values({
    id: roleId,
    companyId,
    name: ROLE_NAME,
    createdBy: sysUserId,
    isDeleted: false,
  });

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
