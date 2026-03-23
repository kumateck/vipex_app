import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';
import { eq, and } from 'drizzle-orm';
import { db } from '../src/db/config';
import { companies, branches, roles, users } from '@/db/schemas';
import { BranchType, UserStatus, UserType } from '@/db/schemas/enums';
import { hashPassword } from '../src/server/utils/password';

const DEMO_EMAIL = 'info@kumateck.com';
const DEMO_FULLNAME = 'gigi';
const DEMO_PASSWORD = 'Pass123$1';
const DEMO_TELEPHONE = '0249667429';

const COMPANY_CODE = 'VIPEX';
const BRANCH_NAME = 'Head Office';
const ROLE_NAME = 'System Admin';

async function main() {
  console.log('🚀 Starting demo user seed...\n');

  console.log('📦 Looking up existing company...');
  const [company] = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(eq(companies.code, COMPANY_CODE))
    .limit(1);

  if (!company) {
    throw new Error(`Company with code '${COMPANY_CODE}' not found.`);
  }
  console.log(`   ✓ Found company: ${company.name} (${company.id})`);

  console.log('🏢 Looking up existing branch...');
  const [branch] = await db
    .select({ id: branches.id, name: branches.name, type: branches.type })
    .from(branches)
    .where(and(eq(branches.companyId, company.id), eq(branches.name, BRANCH_NAME)))
    .limit(1);

  if (!branch) {
    throw new Error(`Branch '${BRANCH_NAME}' not found in company ${company.id}.`);
  }
  if (branch.type !== BranchType.HEADOFFICE) {
    throw new Error(`Branch '${BRANCH_NAME}' is not configured as HEAD OFFICE.`);
  }
  console.log(`   ✓ Found branch: ${branch.name} (${branch.id})`);

  console.log('👤 Looking up existing role...');
  const [role] = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(and(eq(roles.companyId, company.id), eq(roles.name, ROLE_NAME)))
    .limit(1);

  if (!role) {
    throw new Error(`Role '${ROLE_NAME}' not found in company ${company.id}.`);
  }
  console.log(`   ✓ Found role:  ${role.name} (${role.id})`);

  console.log('🔑 Checking/creating demo user...');
  const [existingUser] = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.email, DEMO_EMAIL))
    .limit(1);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    console.log(`   ✓ User already exists: ${DEMO_EMAIL} (${userId})`);
  } else {
    console.log('🔐 Hashing password...');
    const hashedPassword = await hashPassword(DEMO_PASSWORD);
    userId = createId();
    await db.insert(users).values({
      id: userId,
      fullname: DEMO_FULLNAME,
      telephone: DEMO_TELEPHONE,
      email: DEMO_EMAIL,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      roleId: role.id,
      companyId: company.id,
      branchId: branch.id,
      locationId: null,
      userType: UserType.STAFF,
      createdBy: userId,
      taxReportConfirmation: false,
    });
    console.log(`   ✓ Created demo user: ${DEMO_EMAIL} (${userId})`);
  }

  console.log('\n✅ Demo user seed complete!\n');
  console.log('═══════════════════════════════════════');
  console.log('📋 Summary:');
  console.log('═══════════════════════════════════════');
  console.log(`Company:    ${company.name} (${company.id})`);
  console.log(`Branch:     ${branch.name} (${branch.id})`);
  console.log(`Role:       ${role.name} (${role.id})`);
  console.log(`User:       ${DEMO_FULLNAME}`);
  console.log(`Email:      ${DEMO_EMAIL}`);
  console.log(`Telephone:  ${DEMO_TELEPHONE}`);
  console.log(`User ID:    ${userId}`);
  console.log('═══════════════════════════════════════');

  if (!existingUser) {
    console.log('\n🔐 Login credentials:');
    console.log(`   Email:    ${DEMO_EMAIL}`);
    console.log(`   Password: ${DEMO_PASSWORD}`);
    console.log('\n✨ You can now log in!\n');
  } else {
    console.log('\nℹ️ Existing user was left unchanged.\n');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed error:', err);
  console.error('\n💡 Tips:');
  console.error('   - Check that COMPANY_CODE, BRANCH_NAME, and ROLE_NAME match your database');
  console.error('   - Verify your database connection is configured correctly');
  console.error("   - Run migrations if you haven't already\n");
  process.exit(1);
});
