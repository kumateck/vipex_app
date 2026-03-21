import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';
import { eq, and } from 'drizzle-orm';
import { db } from '../src/db/config';
import { companies, branches, roles, users } from '@/db/schemas';
import { BranchType, UserStatus, UserType } from '@/db/schemas/enums';
import { hashPassword } from '../src/server/utils/password';

// Superadmin credentials
const SUPERADMIN_EMAIL = 'desdhi24@gmail.com';
const SUPERADMIN_FULLNAME = 'Desmond Kofi Adusei';
const SUPERADMIN_PASSWORD = 'Pass123$1';
const SUPERADMIN_TELEPHONE = '+233248111128'; // Update if you have a specific number

// Existing company/branch/role identifiers
const COMPANY_CODE = 'VIPEX'; // Adjust if different
const BRANCH_NAME = 'Head Office'; // Adjust if different
const ROLE_NAME = 'System Admin'; // Or 'Super Admin' - adjust to match your existing role

async function main() {
  console.log('🚀 Starting superadmin seed for Desmond Kofi Adusei...\n');

  // Hash the password securely
  console.log('🔐 Hashing password...');
  const hashedPassword = await hashPassword(SUPERADMIN_PASSWORD);

  // 1) Find existing company by code
  console.log('📦 Looking up existing company...');
  const [company] = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(eq(companies.code, COMPANY_CODE))
    .limit(1);

  if (!company) {
    throw new Error(`Company with code '${COMPANY_CODE}' not found.  Please check COMPANY_CODE. `);
  }
  console.log(`   ✓ Found company: ${company.name} (${company.id})`);

  // 2) Find existing branch by company + name
  console.log('🏢 Looking up existing branch...');
  const [branch] = await db
    .select({ id: branches.id, name: branches.name, type: branches.type })
    .from(branches)
    .where(and(eq(branches.companyId, company.id), eq(branches.name, BRANCH_NAME)))
    .limit(1);

  if (!branch) {
    throw new Error(
      `Branch '${BRANCH_NAME}' not found in company ${company.id}. Please check BRANCH_NAME.`,
    );
  }
  if (branch.type !== BranchType.HEADOFFICE) {
    throw new Error(`Branch '${BRANCH_NAME}' is not configured as HEAD OFFICE.`);
  }
  console.log(`   ✓ Found branch: ${branch.name} (${branch.id})`);

  // 3) Find existing role by company + name
  console.log('👤 Looking up existing role...');
  const [role] = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(and(eq(roles.companyId, company.id), eq(roles.name, ROLE_NAME)))
    .limit(1);

  if (!role) {
    throw new Error(
      `Role '${ROLE_NAME}' not found in company ${company.id}. Please check ROLE_NAME.`,
    );
  }
  console.log(`   ✓ Found role:  ${role.name} (${role.id})`);

  // 4) Create or update superadmin user
  console.log('🔑 Checking/creating superadmin user.. .');
  const [existingUser] = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.email, SUPERADMIN_EMAIL))
    .limit(1);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    console.log(`   ✓ User already exists: ${SUPERADMIN_EMAIL} (${userId})`);

    // Update password, ensure ACTIVE status, and update other fields
    await db
      .update(users)
      .set({
        fullname: SUPERADMIN_FULLNAME,
        telephone: SUPERADMIN_TELEPHONE,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        roleId: role.id,
        companyId: company.id,
        branchId: branch.id,
        locationId: null,
        userType: UserType.STAFF,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    console.log(`   ✓ Updated user details, password, and status to ACTIVE`);
  } else {
    userId = createId();
    await db.insert(users).values({
      id: userId,
      fullname: SUPERADMIN_FULLNAME,
      telephone: SUPERADMIN_TELEPHONE,
      email: SUPERADMIN_EMAIL,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      roleId: role.id,
      companyId: company.id,
      branchId: branch.id,
      locationId: null,
      userType: UserType.STAFF,
      createdBy: userId, // self-created
      taxReportConfirmation: false,
    });
    console.log(`   ✓ Created superadmin user: ${SUPERADMIN_EMAIL} (${userId})`);
  }

  console.log('\n✅ Superadmin seed complete!\n');
  console.log('═══════════════════════════════════════');
  console.log('📋 Summary:');
  console.log('═══════════════════════════════════════');
  console.log(`Company:    ${company.name} (${company.id})`);
  console.log(`Branch:     ${branch.name} (${branch.id})`);
  console.log(`Role:       ${role.name} (${role.id})`);
  console.log(`User:       ${SUPERADMIN_FULLNAME}`);
  console.log(`Email:      ${SUPERADMIN_EMAIL}`);
  console.log(`User ID:    ${userId}`);
  console.log(`Status:     ACTIVE`);
  console.log('═══════════════════════════════════════');
  console.log('\n🔐 Login credentials:');
  console.log(`   Email:    ${SUPERADMIN_EMAIL}`);
  console.log(`   Password: ${SUPERADMIN_PASSWORD}`);
  console.log('\n✨ You can now log in!\n');

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
